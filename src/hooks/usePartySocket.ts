import PartySocket from "partysocket";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { ClientMessage, ServerMessage } from "@/types/party";

export function usePartySocket() {
  const { user, isLoading } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<PartySocket | null>(null);

  useEffect(() => {
    // Don't connect while auth is still loading
    if (isLoading) {
      return;
    }

    // Prevent multiple connections
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    // Determine PartyKit host based on environment
    const host =
      process.env.NEXT_PUBLIC_PARTYKIT_HOST ||
      (process.env.NODE_ENV === "development" ? "localhost:1999" : "");

    if (!host) {
      setError("PartyKit host not configured");
      return;
    }

    // Create PartySocket connection
    const socket = new PartySocket({
      host,
      room: "main", // Single main room for all connections
      query: user?.id ? { userId: user.id } : undefined,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.addEventListener("open", () => {
      setIsConnected(true);
      setError(null);

      // Join user-specific room for friend notifications (only if authenticated)
      if (user?.id) {
        const msg: ClientMessage = { type: "join:user", userId: user.id };
        socket.send(JSON.stringify(msg));
      }
    });

    socket.addEventListener("close", () => {
      setIsConnected(false);
    });

    socket.addEventListener("error", (event) => {
      setError("Socket connection error");
      setIsConnected(false);
      console.error("PartySocket error:", event);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [user, isLoading]);

  // Provide methods to interact with the socket
  const joinWishlist = (wishlistId: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const msg: ClientMessage = { type: "join:wishlist", wishlistId };
      socketRef.current.send(JSON.stringify(msg));
    }
  };

  const leaveWishlist = (wishlistId: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const msg: ClientMessage = { type: "leave:wishlist", wishlistId };
      socketRef.current.send(JSON.stringify(msg));
    }
  };

  const on = (
    eventType: ServerMessage["type"],
    listener: (data: Record<string, unknown>) => void
  ) => {
    if (socketRef.current) {
      const handleMessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data as string) as ServerMessage;
          if (message.type === eventType) {
            if ("data" in message) {
              listener(message.data as Record<string, unknown>);
            } else {
              listener(message as Record<string, unknown>);
            }
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      socketRef.current.addEventListener("message", handleMessage as EventListener);
      // Store the handler for cleanup
      const socket = socketRef.current as PartySocket & {
        _handlers?: Map<string, Set<(event: MessageEvent) => void>>;
      };
      if (!socket._handlers) {
        socket._handlers = new Map();
      }
      if (!socket._handlers.has(eventType)) {
        socket._handlers.set(eventType, new Set());
      }
      socket._handlers.get(eventType)?.add(handleMessage);
    }
  };

  const off = (
    eventType: ServerMessage["type"],
    _listener?: (data: Record<string, unknown>) => void
  ) => {
    if (socketRef.current) {
      const socket = socketRef.current as PartySocket & {
        _handlers?: Map<string, Set<(event: MessageEvent) => void>>;
      };
      const eventHandlers = socket._handlers?.get(eventType);
      if (eventHandlers) {
        for (const handler of eventHandlers) {
          socketRef.current.removeEventListener("message", handler as EventListener);
        }
        eventHandlers.clear();
      }
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    error,
    joinWishlist,
    leaveWishlist,
    on,
    off,
  };
}
