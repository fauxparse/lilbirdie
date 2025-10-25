import { Server as HTTPServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { prisma } from "@/lib/db";
import { ClaimWithUser, WishlistItemResponse } from "@/types";

export interface ServerToClientEvents {
  "wishlist:item:added": (data: { item: WishlistItemResponse; wishlistId: string }) => void;
  "wishlist:item:updated": (data: { itemId: string; wishlistId: string }) => void;
  "wishlist:item:deleted": (data: { itemId: string; wishlistId: string }) => void;
  "wishlist:updated": (data: { wishlistId: string }) => void;
  "claim:created": (data: { claim: ClaimWithUser }) => void;
  "claim:removed": (data: { itemId: string; wishlistId: string; userId: string }) => void;
  "friend:request": (data: { requestId: string; requesterId: string }) => void;
  "friend:accepted": (data: { friendshipId: string; userId: string }) => void;
  error: (message: string) => void;
  pong: () => void;
}

export interface ClientToServerEvents {
  "join:wishlist": (wishlistId: string) => void;
  "leave:wishlist": (wishlistId: string) => void;
  "join:user": (userId: string) => void;
  "leave:user": (userId: string) => void;
  ping: () => void;
}

export type InterServerEvents = Record<string, never>;

export interface SocketData {
  userId?: string;
  joinedWishlists: Set<string>;
  joinedUserRooms: Set<string>;
}

export type SocketIOServerType = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

let io: SocketIOServerType | undefined;

// Global reference to make io accessible from API routes
declare global {
  var __socket_io: SocketIOServerType | undefined;
}

export function initializeSocket(httpServer: HTTPServer): SocketIOServerType {
  if (io) {
    return io;
  }

  io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "development" ? "http://localhost:3000" : false,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Set global reference for API routes
  global.__socket_io = io;

  io.use(async (socket, next) => {
    try {
      // Extract session token from cookies in handshake
      const cookieHeader = socket.handshake.headers.cookie;

      // Allow anonymous users, but authenticate if session exists
      if (cookieHeader) {
        try {
          // Extract session token from cookies
          const sessionToken = cookieHeader
            .split(";")
            .find((cookie) => cookie.trim().startsWith("better-auth.session_token="))
            ?.split("=")[1];

          if (sessionToken) {
            // Try a different approach - use the session token to verify the user
            // We'll create a simple verification by checking if the session token exists in the database
            try {
              // For now, let's try to verify the session by making a request to the auth endpoint
              const response = await fetch("http://localhost:3000/api/auth/session", {
                headers: {
                  cookie: cookieHeader,
                },
              });

              if (response.ok) {
                const sessionData = await response.json();
                if (sessionData?.user?.id) {
                  socket.data.userId = sessionData.user.id;
                  socket.data.joinedWishlists = new Set();
                  socket.data.joinedUserRooms = new Set();
                } else {
                }
              } else {
              }
            } catch {}
          }
        } catch {}
      }

      // Allow anonymous users to connect
      if (!socket.data.userId) {
        socket.data.userId = undefined;
        socket.data.joinedWishlists = new Set();
        socket.data.joinedUserRooms = new Set();
      }

      // Store connection in database (only for authenticated users)
      if (socket.data.userId) {
        await prisma.webSocketConnection.create({
          data: {
            socketId: socket.id,
            userId: socket.data.userId,
            connectedAt: new Date(),
            lastPing: new Date(),
          },
        });
      }

      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    // Handle joining wishlist rooms
    socket.on("join:wishlist", async (wishlistId: string) => {
      try {
        const userId = socket.data.userId;

        // Verify user has access to this wishlist
        const wishlist = await prisma.wishlist.findFirst({
          where: {
            id: wishlistId,
            OR: [
              // Anonymous users can only access public wishlists
              ...(userId
                ? [
                    { ownerId: userId },
                    {
                      privacy: "FRIENDS_ONLY" as const,
                      owner: {
                        OR: [
                          { friendsInitiated: { some: { friendId: userId } } },
                          { friendsReceived: { some: { userId: userId } } },
                        ],
                      },
                    },
                    { editors: { some: { userId: userId } } },
                  ]
                : []),
              // All users (including anonymous) can access public wishlists
              { privacy: "PUBLIC" as const },
            ],
          },
        });

        if (!wishlist) {
          socket.emit("error", "Access denied to wishlist");
          return;
        }

        // Join the wishlist room
        await socket.join(`wishlist:${wishlistId}`);
        socket.data.joinedWishlists.add(wishlistId);

        // Update database connection (only for authenticated users)
        if (userId) {
          await prisma.webSocketConnection.update({
            where: { socketId: socket.id },
            data: {
              wishlistId: wishlistId,
              lastPing: new Date(),
            },
          });
        }
      } catch (error) {
        console.error("Error joining wishlist room:", error);
        socket.emit("error", "Failed to join wishlist");
      }
    });

    // Handle leaving wishlist rooms
    socket.on("leave:wishlist", async (wishlistId: string) => {
      await socket.leave(`wishlist:${wishlistId}`);
      socket.data.joinedWishlists.delete(wishlistId);

      // Update database connection (only for authenticated users)
      if (socket.data.userId) {
        await prisma.webSocketConnection.update({
          where: { socketId: socket.id },
          data: {
            wishlistId: null,
            lastPing: new Date(),
          },
        });
      }
    });

    // Handle joining user-specific rooms (for friend notifications)
    socket.on("join:user", async (userId: string) => {
      if (socket.data.userId !== userId) {
        socket.emit("error", "Can only join your own user room");
        return;
      }

      await socket.join(`user:${userId}`);
      socket.data.joinedUserRooms.add(userId);
    });

    // Handle leaving user rooms
    socket.on("leave:user", async (userId: string) => {
      await socket.leave(`user:${userId}`);
      socket.data.joinedUserRooms.delete(userId);
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      try {
        // Remove connection from database (only for authenticated users)
        if (socket.data.userId) {
          await prisma.webSocketConnection.delete({
            where: { socketId: socket.id },
          });
        }
      } catch (error) {
        console.error("Error cleaning up socket connection:", error);
      }
    });

    // Handle ping for connection tracking
    socket.on("ping", async () => {
      try {
        // Update ping in database (only for authenticated users)
        if (socket.data.userId) {
          await prisma.webSocketConnection.update({
            where: { socketId: socket.id },
            data: { lastPing: new Date() },
          });
        }
        socket.emit("pong");
      } catch (error) {
        console.error("Error updating ping:", error);
      }
    });
  });

  // Clean up stale connections periodically
  setInterval(async () => {
    try {
      const staleThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
      await prisma.webSocketConnection.deleteMany({
        where: {
          lastPing: {
            lt: staleThreshold,
          },
        },
      });
    } catch (error) {
      console.error("Error cleaning up stale connections:", error);
    }
  }, 60 * 1000); // Run every minute

  return io;
}

export function getSocketIO(): SocketIOServerType | undefined {
  return io;
}

// Helper functions to broadcast events
export const SocketEventEmitter = {
  emitToWishlist(wishlistId: string, event: keyof ServerToClientEvents, ...args: unknown[]) {
    const socketIO = io || global.__socket_io;
    if (socketIO) {
      // Use type assertion to work around Socket.IO's complex emit types
      const emitter = socketIO.to(`wishlist:${wishlistId}`) as {
        emit: (event: string, ...args: unknown[]) => void;
      };
      emitter.emit(event, ...args);
    }
  },

  emitToUser(userId: string, event: keyof ServerToClientEvents, ...args: unknown[]) {
    const socketIO = io || global.__socket_io;
    if (socketIO) {
      // Use type assertion to work around Socket.IO's complex emit types
      const emitter = socketIO.to(`user:${userId}`) as {
        emit: (event: string, ...args: unknown[]) => void;
      };
      emitter.emit(event, ...args);
    }
  },

  emitToAll(event: keyof ServerToClientEvents, ...args: unknown[]) {
    const socketIO = io || global.__socket_io;
    if (socketIO) {
      // Use type assertion to work around Socket.IO's complex emit types
      const emitter = socketIO as {
        emit: (event: string, ...args: unknown[]) => void;
      };
      emitter.emit(event, ...args);
    }
  },
};
