import { NextResponse } from "next/server";
import { initSocketServer, getIO } from "@/lib/socket-server";

// Socket.io health check endpoint
export async function GET() {
  const io = getIO();

  return NextResponse.json({
    status: "ok",
    socketio: io ? "initialized" : "not-initialized",
    message:
      "Socket.io runs on the custom server. Use the custom server script or the socket events will be emitted via polling fallback.",
  });
}
