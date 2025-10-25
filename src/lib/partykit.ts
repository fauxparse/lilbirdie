import type { ServerMessage } from "../../party/index";

/**
 * Get the PartyKit host URL based on environment
 */
export const getPartyKitHost = () => {
  if (process.env.PARTYKIT_HOST) {
    return process.env.PARTYKIT_HOST;
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:1999";
  }
  // In production, this will be set by the deployment
  return process.env.NEXT_PUBLIC_PARTYKIT_HOST || "";
};

/**
 * Emit an event to PartyKit server for broadcasting
 */
export const emitToPartyKit = async (message: ServerMessage) => {
  const host = getPartyKitHost();
  if (!host) {
    console.error("PartyKit host not configured");
    return;
  }

  try {
    await fetch(`${host}/party/main`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error("Failed to emit to PartyKit:", error);
  }
};

/**
 * Helper functions to broadcast specific event types
 */
export const PartyKitEventEmitter = {
  emitToWishlist: async (
    wishlistId: string,
    type: ServerMessage["type"],
    data: Record<string, unknown>
  ) => {
    await emitToPartyKit({
      type,
      data: { ...data, wishlistId },
    } as ServerMessage);
  },

  emitToUser: async (
    userId: string,
    type: ServerMessage["type"],
    data: Record<string, unknown>
  ) => {
    await emitToPartyKit({
      type,
      data: { ...data, userId },
    } as ServerMessage);
  },
};
