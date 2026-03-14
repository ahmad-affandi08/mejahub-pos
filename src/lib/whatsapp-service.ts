import "server-only";

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { WASocket } from "@whiskeysockets/baileys";

export type WhatsAppConnectionStatus =
  | "DISCONNECTED"
  | "CONNECTING"
  | "QR_READY"
  | "CONNECTED"
  | "ERROR";

export interface WhatsAppSessionSnapshot {
  branchId: string;
  status: WhatsAppConnectionStatus;
  phoneNumber: string | null;
  jid: string | null;
  qr: string | null;
  lastError: string | null;
  updatedAt: string;
}

interface RuntimeSession {
  branchId: string;
  authPath: string;
  statePath: string;
  sock: WASocket | null;
  connectPromise: Promise<void> | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  reconnectAttempts: number;
  shouldReconnect: boolean;
  isStopping: boolean;
  status: WhatsAppConnectionStatus;
  phoneNumber: string | null;
  jid: string | null;
  qr: string | null;
  lastError: string | null;
  updatedAt: Date;
}

type GlobalWithWhatsAppSessions = typeof globalThis & {
  __MEJAHUB_WHATSAPP_SESSIONS__?: Map<string, RuntimeSession>;
};

type BaileysRuntime = {
  makeWASocket: (input: Record<string, unknown>) => WASocket;
  useMultiFileAuthState: (
    authPath: string
  ) => Promise<{ state: unknown; saveCreds: () => Promise<void> }>;
  disconnectReasonLoggedOut: number;
  browserDesktop: string[];
  fetchLatestWaWebVersion: () => Promise<{
    version: [number, number, number];
    isLatest: boolean;
    error?: unknown;
  }>;
};

const globalWithSessions = globalThis as GlobalWithWhatsAppSessions;
const runtimeSessions =
  globalWithSessions.__MEJAHUB_WHATSAPP_SESSIONS__ ?? new Map<string, RuntimeSession>();

let baileysRuntimePromise: Promise<BaileysRuntime> | null = null;

async function getBaileysRuntime(): Promise<BaileysRuntime> {
  if (baileysRuntimePromise) {
    return baileysRuntimePromise;
  }

  process.env.WS_NO_BUFFER_UTIL = "1";
  process.env.WS_NO_UTF_8_VALIDATE = "1";

  baileysRuntimePromise = import("@whiskeysockets/baileys").then((module) => ({
    makeWASocket: module.default as unknown as (input: Record<string, unknown>) => WASocket,
    useMultiFileAuthState: module.useMultiFileAuthState as (
      authPath: string
    ) => Promise<{ state: unknown; saveCreds: () => Promise<void> }>,
    disconnectReasonLoggedOut: (module.DisconnectReason as { loggedOut: number }).loggedOut,
    browserDesktop: (module.Browsers as { macOS: (browser: string) => string[] }).macOS(
      "Chrome"
    ),
    fetchLatestWaWebVersion: module.fetchLatestWaWebVersion as () => Promise<{
      version: [number, number, number];
      isLatest: boolean;
      error?: unknown;
    }>,
  }));

  return baileysRuntimePromise;
}

if (!globalWithSessions.__MEJAHUB_WHATSAPP_SESSIONS__) {
  globalWithSessions.__MEJAHUB_WHATSAPP_SESSIONS__ = runtimeSessions;
}

function getAuthPath(branchId: string) {
  return join(process.cwd(), ".wa-sessions", branchId);
}

function getStatePath(branchId: string) {
  return join(process.cwd(), ".wa-sessions", ".state", `${branchId}.json`);
}

function extractPhoneFromJid(jid?: string | null): string | null {
  if (!jid) return null;
  const value = jid.split("@")[0]?.split(":")[0] ?? "";
  const digits = value.replace(/\D/g, "");
  return digits || null;
}

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith("8")) {
    return `62${digits}`;
  }

  return digits;
}

function toSnapshot(session: RuntimeSession): WhatsAppSessionSnapshot {
  return {
    branchId: session.branchId,
    status: session.status,
    phoneNumber: session.phoneNumber,
    jid: session.jid,
    qr: session.qr,
    lastError: session.lastError,
    updatedAt: session.updatedAt.toISOString(),
  };
}

async function persistSnapshot(session: RuntimeSession) {
  try {
    await mkdir(join(process.cwd(), ".wa-sessions", ".state"), { recursive: true });
    await writeFile(session.statePath, JSON.stringify(toSnapshot(session)), "utf-8");
  } catch {
    // ignore snapshot persistence failures
  }
}

async function readPersistedSnapshot(
  branchId: string
): Promise<WhatsAppSessionSnapshot | null> {
  try {
    const raw = await readFile(getStatePath(branchId), "utf-8");
    const parsed = JSON.parse(raw) as WhatsAppSessionSnapshot;

    if (!parsed || parsed.branchId !== branchId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function touch(session: RuntimeSession) {
  session.updatedAt = new Date();
  void persistSnapshot(session);
}

function getOrCreateSession(branchId: string): RuntimeSession {
  const existing = runtimeSessions.get(branchId);
  if (existing) return existing;

  const created: RuntimeSession = {
    branchId,
    authPath: getAuthPath(branchId),
    statePath: getStatePath(branchId),
    sock: null,
    connectPromise: null,
    reconnectTimer: null,
    reconnectAttempts: 0,
    shouldReconnect: false,
    isStopping: false,
    status: "DISCONNECTED",
    phoneNumber: null,
    jid: null,
    qr: null,
    lastError: null,
    updatedAt: new Date(),
  };

  runtimeSessions.set(branchId, created);
  return created;
}

function scheduleReconnect(session: RuntimeSession) {
  if (session.reconnectTimer || !session.shouldReconnect || session.isStopping) return;

  const delay = Math.min(2_500 * Math.max(1, session.reconnectAttempts), 20_000);
  session.reconnectTimer = setTimeout(() => {
    session.reconnectTimer = null;
    if (!session.shouldReconnect || session.isStopping) {
      return;
    }
    void startWhatsAppSession(session.branchId);
  }, delay);
}

async function waitForInitialState(session: RuntimeSession, timeoutMs = 10_000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (
      session.status === "QR_READY" ||
      session.status === "CONNECTED" ||
      session.status === "ERROR"
    ) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

async function resetSessionStorage(session: RuntimeSession) {
  await rm(session.authPath, { recursive: true, force: true });
  await rm(session.statePath, { force: true });
}

async function setupSocket(session: RuntimeSession) {
  const runtime = await getBaileysRuntime();
  const latestVersion = await runtime.fetchLatestWaWebVersion().catch(() => ({
    version: [2, 3000, 1027934701] as [number, number, number],
    isLatest: false,
  }));

  await mkdir(session.authPath, { recursive: true });
  const { state, saveCreds } = await runtime.useMultiFileAuthState(session.authPath);

  const sock = runtime.makeWASocket({
    auth: state,
    version: latestVersion.version,
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    browser: runtime.browserDesktop,
    syncFullHistory: false,
  });

  session.sock = sock;
  session.isStopping = false;
  session.shouldReconnect = true;
  session.status = "CONNECTING";
  session.qr = null;
  touch(session);

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    if (update.qr) {
      session.reconnectAttempts = 0;
      session.status = "QR_READY";
      session.qr = update.qr;
      session.lastError = null;
      touch(session);
    }

    if (update.connection === "open") {
      session.reconnectAttempts = 0;
      const userJid = sock.user?.id ?? null;
      session.status = "CONNECTED";
      session.jid = userJid;
      session.phoneNumber = extractPhoneFromJid(userJid);
      session.qr = null;
      session.lastError = null;
      touch(session);
    }

    if (update.connection === "close") {
      if (session.isStopping || !session.shouldReconnect) {
        session.sock = null;
        session.status = "DISCONNECTED";
        session.qr = null;
        session.lastError = null;
        touch(session);
        return;
      }

      const disconnectMessage =
        update.lastDisconnect?.error instanceof Error
          ? update.lastDisconnect.error.message
          : "";
      const statusCode =
        (update.lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)
          ?.output?.statusCode ?? 0;
      const loggedOut =
        statusCode === runtime.disconnectReasonLoggedOut ||
        /intentional logout/i.test(disconnectMessage);
      const statusCodeLabel = statusCode ? ` (code ${statusCode})` : "";
      const detail = disconnectMessage ? `: ${disconnectMessage}` : "";

      session.sock = null;
      session.qr = null;
      session.status = loggedOut ? "DISCONNECTED" : "CONNECTING";
      if (loggedOut) {
        session.jid = null;
        session.phoneNumber = null;
        session.shouldReconnect = false;
        session.reconnectAttempts = 0;
      } else {
        session.reconnectAttempts += 1;
        if (session.reconnectAttempts >= 6) {
          session.shouldReconnect = false;
          session.status = "ERROR";
          session.lastError = `Gagal membuat sesi WhatsApp setelah beberapa percobaan${statusCodeLabel}${detail}. Coba Tampilkan QR Login lagi.`;
          touch(session);
          return;
        }
      }
      session.lastError = loggedOut
        ? null
        : `Koneksi WhatsApp terputus${statusCodeLabel}${detail}. Mencoba menyambung ulang...`;
      touch(session);

      if (!loggedOut) {
        scheduleReconnect(session);
      }
    }
  });
}

export async function startWhatsAppSession(
  branchId: string,
  options?: {
    forceNewLogin?: boolean;
  }
): Promise<WhatsAppSessionSnapshot> {
  const session = getOrCreateSession(branchId);

  if (options?.forceNewLogin) {
    session.shouldReconnect = false;
    session.isStopping = true;
    session.reconnectAttempts = 0;

    if (session.reconnectTimer) {
      clearTimeout(session.reconnectTimer);
      session.reconnectTimer = null;
    }

    if (session.sock) {
      try {
        await session.sock.logout();
      } catch {
        // ignore logout errors on forced relogin
      }
    }

    session.sock = null;
    session.connectPromise = null;
    session.status = "DISCONNECTED";
    session.phoneNumber = null;
    session.jid = null;
    session.qr = null;
    session.lastError = null;
    session.isStopping = false;
    touch(session);

    await resetSessionStorage(session);
  }

  session.shouldReconnect = true;
  session.isStopping = false;
  session.reconnectAttempts = 0;

  if (session.sock || session.connectPromise) {
    return toSnapshot(session);
  }

  session.connectPromise = setupSocket(session)
    .catch((error) => {
      session.status = "ERROR";
      session.lastError =
        error instanceof Error
          ? error.message
          : "Gagal menginisialisasi WhatsApp service.";
      session.qr = null;
      session.sock = null;
      touch(session);
    })
    .finally(() => {
      session.connectPromise = null;
    });

  await session.connectPromise;
  await waitForInitialState(session, 20_000);
  return toSnapshot(session);
}

export async function getWhatsAppSessionStatus(
  branchId: string
): Promise<WhatsAppSessionSnapshot> {
  const session = getOrCreateSession(branchId);

  const hasRuntimeState =
    session.status !== "DISCONNECTED" ||
    Boolean(session.qr) ||
    Boolean(session.phoneNumber) ||
    Boolean(session.jid) ||
    Boolean(session.lastError);

  if (hasRuntimeState) {
    return toSnapshot(session);
  }

  const persisted = await readPersistedSnapshot(branchId);
  if (persisted) {
    session.status = persisted.status;
    session.phoneNumber = persisted.phoneNumber;
    session.jid = persisted.jid;
    session.qr = persisted.qr;
    session.lastError = persisted.lastError;
    session.updatedAt = persisted.updatedAt ? new Date(persisted.updatedAt) : new Date();
  }

  return toSnapshot(session);
}

export async function stopWhatsAppSession(
  branchId: string
): Promise<WhatsAppSessionSnapshot> {
  const session = getOrCreateSession(branchId);
  session.shouldReconnect = false;
  session.isStopping = true;

  if (session.reconnectTimer) {
    clearTimeout(session.reconnectTimer);
    session.reconnectTimer = null;
  }

  if (session.sock) {
    try {
      await session.sock.logout();
    } catch {
      // ignore socket logout failures
    }
  }

  session.sock = null;
  session.connectPromise = null;
  session.reconnectAttempts = 0;
  session.status = "DISCONNECTED";
  session.phoneNumber = null;
  session.jid = null;
  session.qr = null;
  session.lastError = null;
  session.isStopping = false;
  touch(session);

  await rm(session.authPath, { recursive: true, force: true });

  return toSnapshot(session);
}

export async function sendWhatsAppTextMessage(input: {
  branchId: string;
  phone: string;
  text: string;
}): Promise<{ jid: string }> {
  const session = getOrCreateSession(input.branchId);

  if (!session.sock || session.status !== "CONNECTED") {
    throw new Error(
      "WhatsApp service belum terhubung. Hubungkan dulu di Pengaturan > Service WA."
    );
  }

  const normalizedPhone = normalizePhone(input.phone);
  if (!normalizedPhone) {
    throw new Error("Nomor WhatsApp pelanggan tidak valid.");
  }

  const jid = `${normalizedPhone}@s.whatsapp.net`;
  await session.sock.sendMessage(jid, { text: input.text });

  return { jid };
}
