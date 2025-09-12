import { http, HttpResponse } from "msw";
import { mockUser, mockWishlist, mockWishlistItem } from "../utils";

// API route handlers for MSW
export const handlers = [
  // Auth endpoints
  http.get("/api/auth/session", () => {
    return HttpResponse.json({ user: mockUser });
  }),

  http.post("/api/auth/signin", () => {
    return HttpResponse.json({ user: mockUser });
  }),

  http.post("/api/auth/signout", () => {
    return HttpResponse.json({ success: true });
  }),

  // Wishlist endpoints
  http.get("/api/wishlists", () => {
    return HttpResponse.json([mockWishlist]);
  }),

  http.get("/api/wishlists/:permalink", ({ params }) => {
    return HttpResponse.json({
      ...mockWishlist,
      permalink: params.permalink,
    });
  }),

  http.post("/api/wishlists", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockWishlist,
      ...(body as any),
      id: "new-wishlist-id",
    });
  }),

  http.put("/api/wishlists/:id", async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockWishlist,
      ...(body as any),
      id: params.id,
    });
  }),

  http.delete("/api/wishlists/:id", ({ params }) => {
    return HttpResponse.json({
      success: true,
      deletedId: params.id,
    });
  }),

  // Wishlist items endpoints
  http.get("/api/wishlists/:id/items", () => {
    return HttpResponse.json([mockWishlistItem]);
  }),

  http.post("/api/wishlists/:id/items", async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockWishlistItem,
      ...(body as any),
      id: "new-item-id",
      wishlistId: params.id,
    });
  }),

  http.put("/api/items/:id", async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockWishlistItem,
      ...(body as any),
      id: params.id,
    });
  }),

  http.delete("/api/items/:id", ({ params }) => {
    return HttpResponse.json({
      success: true,
      deletedId: params.id,
    });
  }),

  // Claim endpoints
  http.post("/api/items/:id/claim", ({ params }) => {
    return HttpResponse.json({
      success: true,
      itemId: params.id,
      claimed: true,
    });
  }),

  http.delete("/api/items/:id/claim", ({ params }) => {
    return HttpResponse.json({
      success: true,
      itemId: params.id,
      claimed: false,
    });
  }),

  // Friends endpoints
  http.get("/api/friends", () => {
    return HttpResponse.json([
      {
        id: "friend-1",
        name: "Friend User",
        email: "friend@example.com",
      },
    ]);
  }),

  http.post("/api/friends", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      requestSent: true,
      email: (body as any).email,
    });
  }),

  // URL scraping endpoint
  http.post("/api/scrape-url", async ({ request }) => {
    const body = await request.json();
    const { url } = body as { url: string };

    return HttpResponse.json({
      title: "Test Product Title",
      description: "Test product description",
      imageUrl: "https://example.com/image.jpg",
      price: "29.99",
      currency: "USD",
      url: url,
    });
  }),

  // Error handlers for testing error states
  http.get("/api/error/500", () => {
    return new HttpResponse(null, { status: 500 });
  }),

  http.get("/api/error/404", () => {
    return new HttpResponse(null, { status: 404 });
  }),
];
