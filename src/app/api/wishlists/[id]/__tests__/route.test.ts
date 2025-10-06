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

const mockWishlistService = {
  updateWishlist: vi.fn(),
  deleteWishlist: vi.fn(),
};

const mockPermissionService = {
  hasPermission: vi.fn(),
};

vi.mock("@/lib/services/WishlistService", () => ({
  WishlistService: {
    getInstance: vi.fn(() => mockWishlistService),
  },
}));

vi.mock("@/lib/services/PermissionService", () => ({
  PermissionService: {
    getInstance: vi.fn(() => mockPermissionService),
  },
}));

describe("PUT /api/wishlists/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    const { auth } = await import("@/lib/auth");

    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/wishlists/wishlist-1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Updated Title",
      }),
    });

    const params = Promise.resolve({ id: "wishlist-1" });
    const response = await PUT(request, { params });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
    expect(mockPermissionService.hasPermission).not.toHaveBeenCalled();
    expect(mockWishlistService.updateWishlist).not.toHaveBeenCalled();
  });

  it("should return 403 when user lacks wishlists:write permission", async () => {
    const { auth } = await import("@/lib/auth");

    const mockSession = {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockPermissionService.hasPermission.mockResolvedValue(false);

    const request = new NextRequest("http://localhost:3000/api/wishlists/wishlist-1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Updated Title",
      }),
    });

    const params = Promise.resolve({ id: "wishlist-1" });
    const response = await PUT(request, { params });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Access denied");
    expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
      { userId: "user-1", wishlistId: "wishlist-1" },
      "wishlists:write"
    );
    expect(mockWishlistService.updateWishlist).not.toHaveBeenCalled();
  });

  it("should update wishlist when user has wishlists:write permission", async () => {
    const { auth } = await import("@/lib/auth");

    const mockSession = {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockPermissionService.hasPermission.mockResolvedValue(true);

    const mockUpdatedWishlist = {
      id: "wishlist-1",
      title: "Updated Title",
      description: "Updated Description",
      ownerId: "user-1",
      privacy: "PRIVATE",
    };

    mockWishlistService.updateWishlist.mockResolvedValue(mockUpdatedWishlist);

    const request = new NextRequest("http://localhost:3000/api/wishlists/wishlist-1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Updated Title",
        description: "Updated Description",
      }),
    });

    const params = Promise.resolve({ id: "wishlist-1" });
    const response = await PUT(request, { params });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockUpdatedWishlist);
    expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
      { userId: "user-1", wishlistId: "wishlist-1" },
      "wishlists:write"
    );
    expect(mockWishlistService.updateWishlist).toHaveBeenCalledWith("wishlist-1", "user-1", {
      title: "Updated Title",
      description: "Updated Description",
    });
  });
});

describe("DELETE /api/wishlists/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    const { auth } = await import("@/lib/auth");

    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/wishlists/wishlist-1", {
      method: "DELETE",
    });

    const params = Promise.resolve({ id: "wishlist-1" });
    const response = await DELETE(request, { params });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
    expect(mockPermissionService.hasPermission).not.toHaveBeenCalled();
    expect(mockWishlistService.deleteWishlist).not.toHaveBeenCalled();
  });

  it("should return 403 when user lacks wishlists:delete permission", async () => {
    const { auth } = await import("@/lib/auth");

    const mockSession = {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockPermissionService.hasPermission.mockResolvedValue(false);

    const request = new NextRequest("http://localhost:3000/api/wishlists/wishlist-1", {
      method: "DELETE",
    });

    const params = Promise.resolve({ id: "wishlist-1" });
    const response = await DELETE(request, { params });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Access denied");
    expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
      { userId: "user-1", wishlistId: "wishlist-1" },
      "wishlists:delete"
    );
    expect(mockWishlistService.deleteWishlist).not.toHaveBeenCalled();
  });

  it("should delete wishlist when user has wishlists:delete permission", async () => {
    const { auth } = await import("@/lib/auth");

    const mockSession = {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockPermissionService.hasPermission.mockResolvedValue(true);
    mockWishlistService.deleteWishlist.mockResolvedValue(true);

    const request = new NextRequest("http://localhost:3000/api/wishlists/wishlist-1", {
      method: "DELETE",
    });

    const params = Promise.resolve({ id: "wishlist-1" });
    const response = await DELETE(request, { params });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
      { userId: "user-1", wishlistId: "wishlist-1" },
      "wishlists:delete"
    );
    expect(mockWishlistService.deleteWishlist).toHaveBeenCalledWith("wishlist-1", "user-1");
  });
});
