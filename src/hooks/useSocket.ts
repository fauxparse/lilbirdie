import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/components/AuthProvider";
import type { ClientToServerEvents, ServerToClientEvents } from "@/lib/socket";

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket() {
  const { user, session, isLoading } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<SocketType | null>(null);

  useEffect(() => {
    // Don't connect while auth is still loading
    if (isLoading) {
      return;
    }

    // Prevent multiple connections
    if (socketRef.current?.connected) {
      return;
    }

    // If we're authenticated, make sure we have both user and session
    if (user && !session) {
      return;
    }

    // If we're authenticated, connect as authenticated user
    if (user && session) {
      // Connect as authenticated user
    } else if (user === null && session === null) {
      // Connect as anonymous user
    } else {
      return;
    }

    // Create socket connection - allow both authenticated and anonymous users
    // Anonymous users can still get real-time updates on public information
    const socket: SocketType = io({
      withCredentials: true, // This will send cookies with the request
      autoConnect: true,
      transports:
        process.env.NODE_ENV === "development"
          ? ["polling", "websocket"] // Start with polling in dev to avoid initial errors
          : ["websocket", "polling"], // Use websocket first in production
      timeout: 20000, // 20 second timeout
      forceNew: true, // Force a new connection
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on("connect", () => {
      setIsConnected(true);
      setError(null);

      // Join user-specific room for friend notifications (only if authenticated)
      if (user?.id) {
        socket.emit("join:user", user.id);
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      setError(err.message);
      setIsConnected(false);
    });

    // Add error handler for general socket errors
    socket.on("error", (message) => {
      setError(message || "Socket error");
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [user, session, isLoading]);

  // Provide methods to interact with the socket
  const joinWishlist = (wishlistId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("join:wishlist", wishlistId);
    }
  };

  const leaveWishlist = (wishlistId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave:wishlist", wishlistId);
    }
  };

  const on = <K extends keyof ServerToClientEvents>(
    event: K,
    listener: ServerToClientEvents[K]
  ) => {
    if (socketRef.current) {
      // Use type assertion to work around Socket.IO's complex listener types
      const socket = socketRef.current as {
        on: (event: string, listener: (...args: unknown[]) => void) => void;
      };
      socket.on(event, listener as (...args: unknown[]) => void);
    }
  };

  const off = <K extends keyof ServerToClientEvents>(
    event: K,
    listener?: ServerToClientEvents[K]
  ) => {
    if (socketRef.current) {
      // Use type assertion to work around Socket.IO's complex listener types
      const socket = socketRef.current as {
        off: (event: string, listener?: (...args: unknown[]) => void) => void;
      };
      socket.off(event, listener as (...args: unknown[]) => void);
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
