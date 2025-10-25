"use client";

import { createContext, type ReactNode, useContext } from "react";
import { usePartySocket } from "@/hooks/usePartySocket";
import type { ServerMessage } from "@/types/party";

interface SocketContextType {
  isConnected: boolean;
  error: string | null;
  joinWishlist: (wishlistId: string) => void;
  leaveWishlist: (wishlistId: string) => void;
  on: (event: ServerMessage["type"], listener: (data: Record<string, unknown>) => void) => void;
  off: (event: ServerMessage["type"], listener?: (data: Record<string, unknown>) => void) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const socketData = usePartySocket();

  return <SocketContext.Provider value={socketData}>{children}</SocketContext.Provider>;
}

export function useSocketContext(): SocketContextType {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within a SocketProvider");
  }
  return context;
}
