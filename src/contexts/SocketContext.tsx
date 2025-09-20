"use client";

import { createContext, type ReactNode, useContext } from "react";
import { useSocket } from "@/hooks/useSocket";
import type { ServerToClientEvents } from "@/lib/socket";

interface SocketContextType {
  isConnected: boolean;
  error: string | null;
  joinWishlist: (wishlistId: string) => void;
  leaveWishlist: (wishlistId: string) => void;
  on: <K extends keyof ServerToClientEvents>(event: K, listener: ServerToClientEvents[K]) => void;
  off: <K extends keyof ServerToClientEvents>(event: K, listener?: ServerToClientEvents[K]) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const socketData = useSocket();

  return <SocketContext.Provider value={socketData}>{children}</SocketContext.Provider>;
}

export function useSocketContext(): SocketContextType {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within a SocketProvider");
  }
  return context;
}
