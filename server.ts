/**
 * Custom Next.js server with Socket.io integration.
 * Usage: node server.js (production) or npx tsx server.ts (dev)
 */
import { createServer } from "http";
import next from "next";
import { initSocketServer } from "./src/lib/socket-server.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  // Initialize Socket.io on the HTTP server
  initSocketServer(httpServer);

  httpServer.listen(port, () => {
    console.log(`🚀 Server ready on http://${hostname}:${port}`);
    console.log(`📡 Socket.io ready on ws://${hostname}:${port}/api/socketio`);
  });
});
