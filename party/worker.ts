// Worker entry point that handles routing to Durable Objects
// This mimics PartyKit's routing structure when deployed directly to Cloudflare

import { WishlistServer } from "./index";

export { WishlistServer };

export default {
  async fetch(request: Request, env: { parties: DurableObjectNamespace }): Promise<Response> {
    const url = new URL(request.url);

    // Handle PartyKit-style URLs: /parties/:partyName/:roomId
    // or direct connection attempts
    let roomName = "main";

    // Extract room from URL path
    const pathParts = url.pathname.split("/").filter(Boolean);
    if (pathParts.length >= 2 && pathParts[0] === "parties") {
      // Format: /parties/partyName/roomId
      roomName = pathParts[2] || pathParts[1] || "main";
    } else if (pathParts.length >= 1) {
      // Format: /roomId
      roomName = pathParts[0];
    }

    // Get Durable Object ID
    const id = env.parties.idFromName(roomName);
    const stub = env.parties.get(id);

    // Forward the request to the Durable Object
    return stub.fetch(request);
  },
};
