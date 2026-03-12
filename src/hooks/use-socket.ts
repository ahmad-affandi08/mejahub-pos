"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { SocketEvent } from "@/lib/socket-server";

let globalSocket: Socket | null = null;

function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io({
      path: "/api/socketio",
      addTrailingSlash: false,
      autoConnect: false,
    });
  }
  return globalSocket;
}

/**
 * Hook to connect to Socket.io and listen for real-time events.
 * Automatically joins the branch room.
 */
export function useSocket(branchId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!branchId) return;

    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }

    function handleConnect() {
      setIsConnected(true);
      socket.emit("join-branch", branchId);
    }

    function handleDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // If already connected, join room
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [branchId]);

  const on = useCallback(
    (event: SocketEvent, handler: (data: unknown) => void) => {
      const socket = socketRef.current;
      if (!socket) return () => {};

      socket.on(event, handler);
      return () => {
        socket.off(event, handler);
      };
    },
    []
  );

  return { isConnected, on, socket: socketRef.current };
}

/**
 * Hook for KDS real-time updates
 */
export function useKDSSocket(branchId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!branchId) return;

    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }

    function handleConnect() {
      setIsConnected(true);
      socket.emit("join-branch", branchId);
      socket.emit("join-kds", branchId);
    }

    function handleDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [branchId]);

  const on = useCallback(
    (event: SocketEvent, handler: (data: unknown) => void) => {
      const socket = socketRef.current;
      if (!socket) return () => {};

      socket.on(event, handler);
      return () => {
        socket.off(event, handler);
      };
    },
    []
  );

  return { isConnected, on, socket: socketRef.current };
}
