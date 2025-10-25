import type * as Party from "partykit/server";

// Types for messages sent between client and server
export type ClientMessage =
  | { type: "join:wishlist"; wishlistId: string }
  | { type: "leave:wishlist"; wishlistId: string }
  | { type: "join:user"; userId: string }
  | { type: "leave:user"; userId: string }
  | { type: "ping" };

export type ServerMessage =
  | {
      type: "wishlist:item:added";
      data: { item: unknown; wishlistId: string };
    }
  | {
      type: "wishlist:item:updated";
      data: { itemId: string; wishlistId: string };
    }
  | {
      type: "wishlist:item:deleted";
      data: { itemId: string; wishlistId: string };
    }
  | {
      type: "wishlist:updated";
      data: { wishlistId: string };
    }
  | {
      type: "claim:created";
      data: { claim: unknown };
    }
  | {
      type: "claim:removed";
      data: { itemId: string; wishlistId: string; userId: string };
    }
  | {
      type: "friend:request";
      data: { requestId: string; requesterId: string };
    }
  | {
      type: "friend:accepted";
      data: { friendshipId: string; userId: string };
    }
  | { type: "error"; message: string }
  | { type: "pong" }
  | { type: "connected" };

interface ConnectionState {
  userId?: string;
  joinedWishlists: Set<string>;
  joinedUserRooms: Set<string>;
}

class WishlistServer implements Party.Server {
  connectionStates: Map<string, ConnectionState>;

  constructor(readonly room: Party.Room) {
    this.connectionStates = new Map();
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`Connected: ${conn.id} to room ${this.room.id}`);

    // Initialize connection state
    this.connectionStates.set(conn.id, {
      userId: undefined,
      joinedWishlists: new Set(),
      joinedUserRooms: new Set(),
    });

    // Extract user ID from URL parameters if provided
    const url = new URL(ctx.request.url);
    const userId = url.searchParams.get("userId");
    if (userId) {
      const state = this.connectionStates.get(conn.id);
      if (state) {
        state.userId = userId;
      }
    }

    // Send connected confirmation
    conn.send(JSON.stringify({ type: "connected" }));
  }

  onMessage(message: string | ArrayBuffer, sender: Party.Connection) {
    if (typeof message !== "string") {
      return;
    }

    try {
      const msg = JSON.parse(message) as ClientMessage;
      const state = this.connectionStates.get(sender.id);

      if (!state) {
        sender.send(JSON.stringify({ type: "error", message: "Invalid connection state" }));
        return;
      }

      switch (msg.type) {
        case "join:wishlist": {
          state.joinedWishlists.add(msg.wishlistId);
          console.log(`Connection ${sender.id} joined wishlist ${msg.wishlistId}`);
          break;
        }

        case "leave:wishlist": {
          state.joinedWishlists.delete(msg.wishlistId);
          console.log(`Connection ${sender.id} left wishlist ${msg.wishlistId}`);
          break;
        }

        case "join:user": {
          if (state.userId !== msg.userId) {
            sender.send(
              JSON.stringify({ type: "error", message: "Can only join your own user room" })
            );
            return;
          }
          state.joinedUserRooms.add(msg.userId);
          console.log(`Connection ${sender.id} joined user room ${msg.userId}`);
          break;
        }

        case "leave:user": {
          state.joinedUserRooms.delete(msg.userId);
          console.log(`Connection ${sender.id} left user room ${msg.userId}`);
          break;
        }

        case "ping": {
          sender.send(JSON.stringify({ type: "pong" }));
          break;
        }

        default: {
          sender.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      sender.send(JSON.stringify({ type: "error", message: "Failed to process message" }));
    }
  }

  onClose(connection: Party.Connection) {
    this.connectionStates.delete(connection.id);
    console.log(`Disconnected: ${connection.id}`);
  }

  onError(connection: Party.Connection, error: Error) {
    console.error(`Error on connection ${connection.id}:`, error);
    connection.send(JSON.stringify({ type: "error", message: error.message }));
  }

  // Handle HTTP requests for broadcasting events from API routes
  async onRequest(req: Party.Request) {
    if (req.method === "POST") {
      try {
        const body = (await req.json()) as ServerMessage;

        // Broadcast to appropriate connections based on message type
        if ("type" in body) {
          if (
            body.type === "wishlist:item:added" ||
            body.type === "wishlist:item:updated" ||
            body.type === "wishlist:item:deleted" ||
            body.type === "wishlist:updated" ||
            body.type === "claim:created" ||
            body.type === "claim:removed"
          ) {
            // Broadcast to all connections that joined this wishlist
            // All these types have wishlistId in their data
            const wishlistId = "wishlistId" in body.data ? body.data.wishlistId : undefined;
            if (wishlistId && typeof wishlistId === "string") {
              this.broadcastToWishlist(wishlistId, body);
            }
          } else if (body.type === "friend:request" || body.type === "friend:accepted") {
            // These need to be sent to specific user rooms
            // The API will call this with a specific room ID
            this.room.broadcast(JSON.stringify(body));
          }
        }

        return new Response("OK", { status: 200 });
      } catch (error) {
        console.error("Error processing broadcast request:", error);
        return new Response("Bad request", { status: 400 });
      }
    }

    return new Response("Method not allowed", { status: 405 });
  }

  private broadcastToWishlist(wishlistId: string, message: ServerMessage) {
    const connections = [...this.room.getConnections()];
    for (const conn of connections) {
      const state = this.connectionStates.get(conn.id);
      if (state?.joinedWishlists.has(wishlistId)) {
        conn.send(JSON.stringify(message));
      }
    }
  }
}

WishlistServer satisfies Party.Worker;

// Export for both PartyKit and Cloudflare Workers
export default WishlistServer;
export { WishlistServer };
