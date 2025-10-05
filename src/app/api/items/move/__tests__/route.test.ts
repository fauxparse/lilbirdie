import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

// Mock the auth module
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock the WishlistItemService
const mockWishlistItemService = {
  getItemById: vi.fn(),
  moveItems: vi.fn(),
};

vi.mock("@/lib/services/WishlistItemService", () => ({
  WishlistItemService: {
    getInstance: vi.fn(() => mockWishlistItemService),
  },
}));

// Mock the socket module
vi.mock("@/lib/socket", () => ({
  SocketEventEmitter: {
    emitToWishlist: vi.fn(),
  },
}));

describe("POST /api/items/move", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should move items successfully and emit real-time events", async () => {
    const { auth } = await import("@/lib/auth");
    const { SocketEventEmitter } = await import("@/lib/socket");

    // Mock session
    const mockSession = {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    // Mock service methods

    mockWishlistItemService.getItemById
      .mockResolvedValueOnce({
        id: "item-1",
        name: "Item 1",
        wishlistId: "source-wishlist",
      } as any)
      .mockResolvedValueOnce({
        id: "item-2",
        name: "Item 2",
        wishlistId: "source-wishlist",
      } as any);

    const mockMovedItems = [
      {
        id: "item-1",
        name: "Item 1",
        wishlistId: "target-wishlist",
        wishlist: { title: "Target Wishlist" },
      },
      {
        id: "item-2",
        name: "Item 2",
        wishlistId: "target-wishlist",
        wishlist: { title: "Target Wishlist" },
      },
    ];

    mockWishlistItemService.moveItems.mockResolvedValue(mockMovedItems);

    // Create request
    const request = new NextRequest("http://localhost:3000/api/items/move", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itemIds: ["item-1", "item-2"],
        targetWishlistId: "target-wishlist",
      }),
    });

    // Call the API
    const response = await POST(request);

    // Should return success
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData).toEqual({
      success: true,
      movedItemsCount: 2,
      targetWishlistId: "target-wishlist",
      items: [
        {
          id: "item-1",
          name: "Item 1",
          wishlistId: "target-wishlist",
          wishlistTitle: "Target Wishlist",
        },
        {
          id: "item-2",
          name: "Item 2",
          wishlistId: "target-wishlist",
          wishlistTitle: "Target Wishlist",
        },
      ],
    });

    // Should call moveItems with correct parameters
    expect(mockWishlistItemService.moveItems).toHaveBeenCalledWith(
      ["item-1", "item-2"],
      "target-wishlist",
      "user-1"
    );

    // Should emit real-time events for removal from source
    expect(SocketEventEmitter.emitToWishlist).toHaveBeenCalledWith(
      "source-wishlist",
      "wishlist:item:deleted",
      {
        itemId: "item-1",
        wishlistId: "source-wishlist",
      }
    );

    expect(SocketEventEmitter.emitToWishlist).toHaveBeenCalledWith(
      "source-wishlist",
      "wishlist:item:deleted",
      {
        itemId: "item-2",
        wishlistId: "source-wishlist",
      }
    );

    // Should emit real-time events for addition to target
    expect(SocketEventEmitter.emitToWishlist).toHaveBeenCalledWith(
      "target-wishlist",
      "wishlist:item:added",
      {
        item: mockMovedItems[0],
        wishlistId: "target-wishlist",
      }
    );

    expect(SocketEventEmitter.emitToWishlist).toHaveBeenCalledWith(
      "target-wishlist",
      "wishlist:item:added",
      {
        item: mockMovedItems[1],
        wishlistId: "target-wishlist",
      }
    );
  });

  it("should return 401 when user is not authenticated", async () => {
    const { auth } = await import("@/lib/auth");

    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/items/move", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itemIds: ["item-1"],
        targetWishlistId: "target-wishlist",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: "Unauthorized" });
  });

  it("should return 400 when itemIds is missing", async () => {
    const { auth } = await import("@/lib/auth");

    const mockSession = {
      user: { id: "user-1" },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const request = new NextRequest("http://localhost:3000/api/items/move", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetWishlistId: "target-wishlist",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: "Item IDs are required" });
  });

  it("should return 400 when targetWishlistId is missing", async () => {
    const { auth } = await import("@/lib/auth");

    const mockSession = {
      user: { id: "user-1" },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const request = new NextRequest("http://localhost:3000/api/items/move", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itemIds: ["item-1"],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: "Target wishlist ID is required" });
  });

  it("should return 400 when itemIds is empty array", async () => {
    const { auth } = await import("@/lib/auth");

    const mockSession = {
      user: { id: "user-1" },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const request = new NextRequest("http://localhost:3000/api/items/move", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itemIds: [],
        targetWishlistId: "target-wishlist",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: "Item IDs are required" });
  });

  it("should return 404 when items not found", async () => {
    const { auth } = await import("@/lib/auth");

    const mockSession = {
      user: { id: "user-1" },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    mockWishlistItemService.getItemById
      .mockResolvedValueOnce({
        id: "item-1",
        name: "Item 1",
        wishlistId: "source-wishlist",
      } as any)
      .mockResolvedValueOnce({
        id: "item-2",
        name: "Item 2",
        wishlistId: "source-wishlist",
      } as any);
    mockWishlistItemService.moveItems.mockRejectedValue(
      new Error("One or more items not found")
    );

    const request = new NextRequest("http://localhost:3000/api/items/move", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itemIds: ["item-1", "item-2"],
        targetWishlistId: "target-wishlist",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(404);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: "One or more items not found" });
  });

  it("should return 403 when access is denied", async () => {
    const { auth } = await import("@/lib/auth");

    const mockSession = {
      user: { id: "user-1" },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    mockWishlistItemService.getItemById.mockResolvedValue({
      id: "item-1",
      name: "Item 1",
      wishlistId: "source-wishlist",
    } as any);
    mockWishlistItemService.moveItems.mockRejectedValue(
      new Error("Access denied to one or more items")
    );

    const request = new NextRequest("http://localhost:3000/api/items/move", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itemIds: ["item-1"],
        targetWishlistId: "target-wishlist",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: "Access denied to one or more items" });
  });

  it("should return 500 for unexpected errors", async () => {
    const { auth } = await import("@/lib/auth");

    const mockSession = {
      user: { id: "user-1" },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    mockWishlistItemService.getItemById.mockResolvedValue({
      id: "item-1",
      name: "Item 1",
      wishlistId: "source-wishlist",
    } as any);
    mockWishlistItemService.moveItems.mockRejectedValue(
      new Error("Database connection failed")
    );

    const request = new NextRequest("http://localhost:3000/api/items/move", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itemIds: ["item-1"],
        targetWishlistId: "target-wishlist",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: "Failed to move items" });
  });
});