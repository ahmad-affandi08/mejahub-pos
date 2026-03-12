import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;

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

/**
 * Emit event to a specific branch room
 */
export function emitToBranch(
  branchId: string,
  event: SocketEvent,
  data: unknown
): void {
  if (!io) return;
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
  if (!io) return;
  io.to(`kds:${branchId}`).emit(event, data);
}
