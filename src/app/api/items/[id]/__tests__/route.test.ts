import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, PUT } from "../route";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    wishlistItem: {
      findUnique: vi.fn(),
    },
  },
}));

const mockWishlistItemService = {
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
};

const mockPermissionService = {
  hasPermission: vi.fn(),
};

vi.mock("@/lib/services/WishlistItemService", () => ({
  WishlistItemService: {
    getInstance: vi.fn(() => mockWishlistItemService),
  },
}));

vi.mock("@/lib/services/PermissionService", () => ({
  PermissionService: {
    getInstance: vi.fn(() => mockPermissionService),
  },
}));

vi.mock("@/lib/partykit", () => ({
  PartyKitEventEmitter: {
    emitToWishlist: vi.fn(),
  },
}));

describe("PUT /api/items/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    const { auth } = await import("@/lib/auth");

    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/items/item-1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Updated Item",
      }),
    });

    const params = Promise.resolve({ id: "item-1" });
    const response = await PUT(request, { params });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
    expect(mockPermissionService.hasPermission).not.toHaveBeenCalled();
    expect(mockWishlistItemService.updateItem).not.toHaveBeenCalled();
  });

  it("should return 403 when user lacks items:write permission", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/db");

    const mockSession = {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    // Mock item lookup
    vi.mocked(prisma.wishlistItem.findUnique).mockResolvedValue({
      id: "item-1",
      wishlistId: "wishlist-1",
      isDeleted: false,
    } as any);

    mockPermissionService.hasPermission.mockResolvedValue(false);

    const request = new NextRequest("http://localhost:3000/api/items/item-1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Updated Item",
      }),
    });

    const params = Promise.resolve({ id: "item-1" });
    const response = await PUT(request, { params });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Access denied");
    expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
      { userId: "user-1", wishlistId: "wishlist-1" },
      "items:write"
    );
    expect(mockWishlistItemService.updateItem).not.toHaveBeenCalled();
  });

  it("should update item when user has items:write permission", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/db");
    const { PartyKitEventEmitter } = await import("@/lib/partykit");

    const mockSession = {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    // Mock item lookup
    vi.mocked(prisma.wishlistItem.findUnique).mockResolvedValue({
      id: "item-1",
      wishlistId: "wishlist-1",
      isDeleted: false,
    } as any);

    mockPermissionService.hasPermission.mockResolvedValue(true);

    const mockUpdatedItem = {
      id: "item-1",
      name: "Updated Item",
      description: "Updated Description",
      wishlistId: "wishlist-1",
      price: 99.99,
      currency: "USD",
      priority: 5,
    };

    mockWishlistItemService.updateItem.mockResolvedValue(mockUpdatedItem);

    const request = new NextRequest("http://localhost:3000/api/items/item-1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Updated Item",
        description: "Updated Description",
        price: 99.99,
      }),
    });

    const params = Promise.resolve({ id: "item-1" });
    const response = await PUT(request, { params });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockUpdatedItem);
    expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
      { userId: "user-1", wishlistId: "wishlist-1" },
      "items:write"
    );
    expect(mockWishlistItemService.updateItem).toHaveBeenCalled();
    expect(PartyKitEventEmitter.emitToWishlist).toHaveBeenCalledWith(
      "wishlist-1",
      "wishlist:item:updated",
      {
        item: mockUpdatedItem,
        wishlistId: "wishlist-1",
      }
    );
  });
});

describe("DELETE /api/items/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    const { auth } = await import("@/lib/auth");

    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/items/item-1", {
      method: "DELETE",
    });

    const params = Promise.resolve({ id: "item-1" });
    const response = await DELETE(request, { params });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
    expect(mockPermissionService.hasPermission).not.toHaveBeenCalled();
    expect(mockWishlistItemService.deleteItem).not.toHaveBeenCalled();
  });

  it("should return 403 when user lacks items:delete permission", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/db");

    const mockSession = {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    // Mock item lookup
    vi.mocked(prisma.wishlistItem.findUnique).mockResolvedValue({
      id: "item-1",
      wishlistId: "wishlist-1",
      isDeleted: false,
    } as any);

    mockPermissionService.hasPermission.mockResolvedValue(false);

    const request = new NextRequest("http://localhost:3000/api/items/item-1", {
      method: "DELETE",
    });

    const params = Promise.resolve({ id: "item-1" });
    const response = await DELETE(request, { params });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Access denied");
    expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
      { userId: "user-1", wishlistId: "wishlist-1" },
      "items:delete"
    );
    expect(mockWishlistItemService.deleteItem).not.toHaveBeenCalled();
  });

  it("should delete item when user has items:delete permission", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/db");
    const { PartyKitEventEmitter } = await import("@/lib/partykit");

    const mockSession = {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    // Mock item lookup
    vi.mocked(prisma.wishlistItem.findUnique).mockResolvedValue({
      id: "item-1",
      wishlistId: "wishlist-1",
      isDeleted: false,
    } as any);

    mockPermissionService.hasPermission.mockResolvedValue(true);
    mockWishlistItemService.deleteItem.mockResolvedValue(undefined);

    const request = new NextRequest("http://localhost:3000/api/items/item-1", {
      method: "DELETE",
    });

    const params = Promise.resolve({ id: "item-1" });
    const response = await DELETE(request, { params });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
      { userId: "user-1", wishlistId: "wishlist-1" },
      "items:delete"
    );
    expect(mockWishlistItemService.deleteItem).toHaveBeenCalledWith("item-1", "user-1");
    expect(PartyKitEventEmitter.emitToWishlist).toHaveBeenCalledWith(
      "wishlist-1",
      "wishlist:item:deleted",
      {
        itemId: "item-1",
        wishlistId: "wishlist-1",
      }
    );
  });
});
