import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../route";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

const mockWishlistService = {
  getWishlistByPermalink: vi.fn(),
};

const mockWishlistItemService = {
  createItem: vi.fn(),
};

vi.mock("@/lib/services/WishlistService", () => ({
  WishlistService: {
    getInstance: vi.fn(() => mockWishlistService),
  },
}));

vi.mock("@/lib/services/WishlistItemService", () => ({
  WishlistItemService: {
    getInstance: vi.fn(() => mockWishlistItemService),
  },
}));

vi.mock("@/lib/socket", () => ({
  SocketEventEmitter: {
    emitToWishlist: vi.fn(),
  },
}));

describe("POST /api/w/[permalink]/items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should emit socket event when item is created successfully", async () => {
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

    // Mock wishlist
    const mockWishlist = {
      id: "wishlist-1",
      title: "Test Wishlist",
      permalink: "test-wishlist",
      ownerId: "user-1",
    };

    mockWishlistService.getWishlistByPermalink.mockResolvedValue(mockWishlist);

    // Mock created item
    const now = new Date();
    const mockItem = {
      id: "item-1",
      name: "Test Item",
      wishlistId: "wishlist-1",
      description: null,
      url: null,
      imageUrl: null,
      price: null,
      currency: "USD",
      priority: 0,
      tags: [],
      createdAt: now,
      updatedAt: now,
    };

    mockWishlistItemService.createItem.mockResolvedValue(mockItem);

    // Create request
    const request = new NextRequest("http://localhost:3000/api/w/test-wishlist/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test Item",
        description: "A test item",
        priority: 1,
      }),
    });

    // Mock params
    const params = Promise.resolve({ permalink: "test-wishlist" });

    // Call the route handler
    const response = await POST(request, { params });

    // Assertions
    expect(response.status).toBe(201);

    // Should create the item
    expect(mockWishlistItemService.createItem).toHaveBeenCalledWith("wishlist-1", "user-1", {
      name: "Test Item",
      description: "A test item",
      url: undefined,
      imageUrl: undefined,
      price: undefined,
      currency: "USD",
      priority: 1,
      tags: [],
    });

    // Should emit socket event
    expect(SocketEventEmitter.emitToWishlist).toHaveBeenCalledWith(
      "wishlist-1",
      "wishlist:item:added",
      {
        item: mockItem,
        wishlistId: "wishlist-1",
      }
    );

    // Response should contain the item
    const responseData = await response.json();
    expect(responseData).toEqual({
      ...mockItem,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  it("should not emit socket event when item creation fails", async () => {
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

    // Mock wishlist
    const mockWishlist = {
      id: "wishlist-1",
      title: "Test Wishlist",
      permalink: "test-wishlist",
      ownerId: "user-1",
    };

    mockWishlistService.getWishlistByPermalink.mockResolvedValue(mockWishlist);

    // Mock item creation failure
    mockWishlistItemService.createItem.mockRejectedValue(new Error("Database error"));

    // Create request
    const request = new NextRequest("http://localhost:3000/api/w/test-wishlist/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test Item",
      }),
    });

    // Mock params
    const params = Promise.resolve({ permalink: "test-wishlist" });

    // Call the route handler
    const response = await POST(request, { params });

    // Should return error
    expect(response.status).toBe(500);

    // Should not emit socket event
    expect(SocketEventEmitter.emitToWishlist).not.toHaveBeenCalled();
  });

  it("should not emit socket event when unauthorized", async () => {
    const { auth } = await import("@/lib/auth");
    const { SocketEventEmitter } = await import("@/lib/socket");

    // Mock no session
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    // Create request
    const request = new NextRequest("http://localhost:3000/api/w/test-wishlist/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test Item",
      }),
    });

    // Mock params
    const params = Promise.resolve({ permalink: "test-wishlist" });

    // Call the route handler
    const response = await POST(request, { params });

    // Should return unauthorized
    expect(response.status).toBe(401);

    // Should not emit socket event
    expect(SocketEventEmitter.emitToWishlist).not.toHaveBeenCalled();
  });

  it("should not emit socket event when wishlist not found", async () => {
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

    // Mock wishlist not found
    mockWishlistService.getWishlistByPermalink.mockResolvedValue(null);

    // Create request
    const request = new NextRequest("http://localhost:3000/api/w/nonexistent/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test Item",
      }),
    });

    // Mock params
    const params = Promise.resolve({ permalink: "nonexistent" });

    // Call the route handler
    const response = await POST(request, { params });

    // Should return not found
    expect(response.status).toBe(404);

    // Should not emit socket event
    expect(SocketEventEmitter.emitToWishlist).not.toHaveBeenCalled();
  });
});
