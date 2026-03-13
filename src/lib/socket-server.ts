import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;
let hasLoggedBridgeWarning = false;

const INTERNAL_EMIT_ENDPOINT =
  process.env.SOCKET_INTERNAL_EMIT_ENDPOINT ||
  `http://127.0.0.1:${process.env.PORT || "3000"}/__socket_emit`;
const INTERNAL_EMIT_TOKEN = process.env.SOCKET_INTERNAL_TOKEN;

/**
 * Initialize Socket.io server (called once from custom server or API route)
 */
export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join branch room for targeted events
    socket.on("join-branch", (branchId: string) => {
      socket.join(`branch:${branchId}`);
      console.log(`[Socket.io] ${socket.id} joined branch:${branchId}`);
    });

    // Join KDS room for kitchen events
    socket.on("join-kds", (branchId: string) => {
      socket.join(`kds:${branchId}`);
      console.log(`[Socket.io] ${socket.id} joined kds:${branchId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  console.log("[Socket.io] Server initialized");
  return io;
}

/**
 * Get the Socket.io server instance
 */
export function getIO(): SocketIOServer | null {
  return io;
}

// ============================================================
// Event Emitters
// ============================================================

export type SocketEvent =
  | "new-order"
  | "order-updated"
  | "order-item-status"
  | "table-status-change"
  | "new-customer-order"
  | "payment-completed"
  | "shift-opened"
  | "shift-closed";

type EmitTarget = "branch" | "kds";

async function emitViaInternalBridge(
  target: EmitTarget,
  branchId: string,
  event: SocketEvent,
  data: unknown
) {
  try {
    await fetch(INTERNAL_EMIT_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(INTERNAL_EMIT_TOKEN
          ? { "x-socket-token": INTERNAL_EMIT_TOKEN }
          : {}),
      },
      body: JSON.stringify({ target, branchId, event, data }),
      cache: "no-store",
    });
  } catch {
    if (!hasLoggedBridgeWarning) {
      hasLoggedBridgeWarning = true;
      console.warn(
        `[Socket.io] Gagal emit via bridge ${INTERNAL_EMIT_ENDPOINT}. Pastikan custom server aktif.`
      );
    }
  }
}

/**
 * Emit event to a specific branch room
 */
export function emitToBranch(
  branchId: string,
  event: SocketEvent,
  data: unknown
): void {
  if (!io) {
    void emitViaInternalBridge("branch", branchId, event, data);
    return;
  }

  io.to(`branch:${branchId}`).emit(event, data);
}

/**
 * Emit event to KDS room
 */
export function emitToKDS(
  branchId: string,
  event: SocketEvent,
  data: unknown
): void {
  if (!io) {
    void emitViaInternalBridge("kds", branchId, event, data);
    return;
  }

  io.to(`kds:${branchId}`).emit(event, data);
}
