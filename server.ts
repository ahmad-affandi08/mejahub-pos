/**
 * Custom Next.js server with Socket.io integration.
 * Usage: node server.js (production) or npx tsx server.ts (dev)
 */
import { createServer } from "http";
import type { IncomingMessage, ServerResponse } from "http";
import next from "next";
import { initSocketServer } from "./src/lib/socket-server.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const internalToken = process.env.SOCKET_INTERNAL_TOKEN;
const useTurbopack = process.env.NEXT_DEV_BUNDLER === "turbopack";

type InternalEmitPayload = {
  target: "branch" | "kds";
  branchId: string;
  event: string;
  data?: unknown;
};

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function isLoopbackAddress(remoteAddress?: string | null) {
  if (!remoteAddress) return false;

  return (
    remoteAddress === "127.0.0.1" ||
    remoteAddress === "::1" ||
    remoteAddress === "::ffff:127.0.0.1"
  );
}

async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw) as T;
}

const app = next({
  dev,
  hostname,
  port,
  ...(dev
    ? useTurbopack
      ? { turbopack: true }
      : { webpack: true }
    : {}),
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    if (req.url === "/__socket_emit") {
      if (req.method !== "POST") {
        sendJson(res, 405, { success: false, error: "Method not allowed" });
        return;
      }

      const tokenHeader = req.headers["x-socket-token"];
      const providedToken = Array.isArray(tokenHeader)
        ? tokenHeader[0]
        : tokenHeader;

      const isAuthorized = internalToken
        ? providedToken === internalToken
        : isLoopbackAddress(req.socket.remoteAddress);

      if (!isAuthorized) {
        sendJson(res, 401, { success: false, error: "Unauthorized" });
        return;
      }

      try {
        const payload = await readJsonBody<InternalEmitPayload>(req);

        if (
          (payload.target !== "branch" && payload.target !== "kds") ||
          typeof payload.branchId !== "string" ||
          !payload.branchId.trim() ||
          typeof payload.event !== "string" ||
          !payload.event.trim()
        ) {
          sendJson(res, 400, { success: false, error: "Invalid payload" });
          return;
        }

        const roomPrefix = payload.target === "kds" ? "kds" : "branch";
        io.to(`${roomPrefix}:${payload.branchId}`).emit(payload.event, payload.data ?? null);

        sendJson(res, 200, { success: true });
      } catch {
        sendJson(res, 400, { success: false, error: "Invalid JSON payload" });
      }

      return;
    }

    handle(req, res);
  });

  // Initialize Socket.io on the HTTP server
  const io = initSocketServer(httpServer);

  httpServer.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `❌ Port ${port} sedang dipakai proses lain. Hentikan proses lama dulu (mis. pkill -f \"tsx server.ts\"), lalu jalankan ulang npm run dev:socket.`
      );
      return;
    }

    console.error("❌ HTTP server error:", error);
  });

  httpServer.listen(port, () => {
    console.log(`🚀 Server ready on http://${hostname}:${port}`);
    console.log(`📡 Socket.io ready on ws://${hostname}:${port}/api/socketio`);
    if (dev) {
      console.log(`🧱 Bundler: ${useTurbopack ? "Turbopack" : "Webpack"}`);
    }
  });
});
