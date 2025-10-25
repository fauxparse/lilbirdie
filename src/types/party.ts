// Shared types for PartyKit/WebSocket messages
// These types are used by both the client and server

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
