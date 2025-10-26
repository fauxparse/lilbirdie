import type * as Party from "partykit/server";

// Import shared types
export type {
  ClientMessage,
  ServerMessage,
} from "../src/types/party";

// Use the imported types
import type { ClientMessage, ServerMessage } from "../src/types/party";

interface ConnectionState {
  userId?: string;
  joinedWishlists: Set<string>;
  joinedUserRooms: Set<string>;
}

class WishlistServer implements Party.Server {
  connectionStates: Map<string, ConnectionState>;
  state: DurableObjectState;

  constructor(
    state: DurableObjectState,
    readonly room: Party.Room
  ) {
    this.state = state;
    this.connectionStates = new Map();
  }

  // Handle incoming requests (WebSocket upgrades and HTTP)
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      // Accept the WebSocket connection
      this.state.acceptWebSocket(server);

      // Create a connection ID
      const connId = crypto.randomUUID();

      // Initialize connection state
      const userId = url.searchParams.get("userId") || undefined;
      this.connectionStates.set(connId, {
        userId,
        joinedWishlists: new Set(),
        joinedUserRooms: new Set(),
      });

      // Store connection ID in the WebSocket
      (server as WebSocket & { connId?: string }).connId = connId;

      // Send connected confirmation
      server.send(JSON.stringify({ type: "connected" }));

      console.log(`WebSocket connected: ${connId} to room ${this.room.id}`);

      return new Response(null, { status: 101, webSocket: client });
    }

    // Handle HTTP requests (for broadcasting from API)
    return this.onRequest(request);
  }

  // Handle WebSocket messages
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const connId = (ws as WebSocket & { connId?: string }).connId;
    if (!connId) return;

    if (typeof message !== "string") return;

    try {
      const msg = JSON.parse(message) as ClientMessage;
      const state = this.connectionStates.get(connId);

      if (!state) {
        ws.send(JSON.stringify({ type: "error", message: "Invalid connection state" }));
        return;
      }

      switch (msg.type) {
        case "join:wishlist": {
          state.joinedWishlists.add(msg.wishlistId);
          console.log(`Connection ${connId} joined wishlist ${msg.wishlistId}`);
          break;
        }

        case "leave:wishlist": {
          state.joinedWishlists.delete(msg.wishlistId);
          console.log(`Connection ${connId} left wishlist ${msg.wishlistId}`);
          break;
        }

        case "join:user": {
          if (state.userId !== msg.userId) {
            ws.send(JSON.stringify({ type: "error", message: "Can only join your own user room" }));
            return;
          }
          state.joinedUserRooms.add(msg.userId);
          console.log(`Connection ${connId} joined user room ${msg.userId}`);
          break;
        }

        case "leave:user": {
          state.joinedUserRooms.delete(msg.userId);
          console.log(`Connection ${connId} left user room ${msg.userId}`);
          break;
        }

        case "ping": {
          ws.send(JSON.stringify({ type: "pong" }));
          break;
        }

        default: {
          ws.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(JSON.stringify({ type: "error", message: "Failed to process message" }));
    }
  }

  // Handle WebSocket close
  async webSocketClose(ws: WebSocket) {
    const connId = (ws as WebSocket & { connId?: string }).connId;
    if (connId) {
      this.connectionStates.delete(connId);
      console.log(`WebSocket disconnected: ${connId}`);
    }
  }

  // Handle WebSocket errors
  async webSocketError(ws: WebSocket, error: unknown) {
    const connId = (ws as WebSocket & { connId?: string }).connId;
    console.error(`WebSocket error on connection ${connId}:`, error);
  }

  // Legacy PartyKit compatibility methods (kept for compatibility but not used)
  onConnect(_conn: Party.Connection, _ctx: Party.ConnectionContext) {
    // This won't be called when using Cloudflare Workers directly
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
            // Broadcast to all connected clients (they filter on the client side)
            const connections = this.state.getWebSockets();
            const messageStr = JSON.stringify(body);
            for (const ws of connections) {
              try {
                ws.send(messageStr);
              } catch (error) {
                console.error("Error broadcasting friend notification:", error);
              }
            }
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
    // Get all WebSocket connections from the Durable Object state
    const connections = this.state.getWebSockets();
    const messageStr = JSON.stringify(message);

    for (const ws of connections) {
      const connId = (ws as WebSocket & { connId?: string }).connId;
      if (connId) {
        const state = this.connectionStates.get(connId);
        if (state?.joinedWishlists.has(wishlistId)) {
          try {
            ws.send(messageStr);
          } catch (error) {
            console.error(`Error sending to connection ${connId}:`, error);
          }
        }
      }
    }
  }
}

WishlistServer satisfies Party.Worker;

// Export for both PartyKit and Cloudflare Workers
export default WishlistServer;
export { WishlistServer };
