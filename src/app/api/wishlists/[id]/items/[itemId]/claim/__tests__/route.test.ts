import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, POST } from "../route";

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
      findFirst: vi.fn(),
    },
    claim: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const mockPermissionService = {
  hasPermission: vi.fn(),
};

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

describe("POST /api/wishlists/[permalink]/items/[itemId]/claim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should emit socket event when claim is created successfully", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/db");
    const { PartyKitEventEmitter } = await import("@/lib/partykit");

    // Mock session
    const mockSession = {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    // Mock wishlist item
    const mockItem = {
      id: "item-1",
      name: "Test Item",
      wishlist: {
        id: "wishlist-1",
        ownerId: "user-2", // Different from claimer
        privacy: "PUBLIC",
      },
    } as any;

    vi.mocked(prisma.wishlistItem.findFirst).mockResolvedValue(mockItem);

    // Mock permission check
    mockPermissionService.hasPermission.mockResolvedValue(true);

    // Mock no existing claim
    vi.mocked(prisma.claim.findUnique).mockResolvedValue(null);

    // Mock created claim
    const mockClaim = {
      id: "claim-1",
      userId: "user-1",
      itemId: "item-1",
      wishlistId: "wishlist-1",
      user: {
        id: "user-1",
        name: "Test User",
        image: null,
      },
    } as any;

    vi.mocked(prisma.claim.create).mockResolvedValue(mockClaim);

    // Create request
    const request = new NextRequest("http://localhost:3000/api/wishlists/test/items/item-1/claim", {
      method: "POST",
    });

    // Mock params
    const params = Promise.resolve({
      permalink: "test",
      itemId: "item-1",
    });

    // Call the route handler
    const response = await POST(request, { params });

    // Assertions
    expect(response.status).toBe(200);

    // Should create the claim
    expect(prisma.claim.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        itemId: "item-1",
        wishlistId: "wishlist-1",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Should emit socket event
    expect(PartyKitEventEmitter.emitToWishlist).toHaveBeenCalledWith(
      "wishlist-1",
      "claim:created",
      {
        claim: mockClaim,
      }
    );

    // Response should indicate success
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.claim).toEqual(mockClaim);
  });

  it("should not emit socket event when claiming own item", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/db");
    const { PartyKitEventEmitter } = await import("@/lib/partykit");

    // Mock session
    const mockSession = {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    // Mock wishlist item owned by same user
    const mockItem = {
      id: "item-1",
      name: "Test Item",
      wishlist: {
        id: "wishlist-1",
        ownerId: "user-1", // Same as claimer
        privacy: "PUBLIC",
      },
    } as any;

    vi.mocked(prisma.wishlistItem.findFirst).mockResolvedValue(mockItem);

    // Create request
    const request = new NextRequest("http://localhost:3000/api/wishlists/test/items/item-1/claim", {
      method: "POST",
    });

    // Mock params
    const params = Promise.resolve({
      permalink: "test",
      itemId: "item-1",
    });

    // Call the route handler
    const response = await POST(request, { params });

    // Should return error
    expect(response.status).toBe(400);

    // Should not emit socket event
    expect(PartyKitEventEmitter.emitToWishlist).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/wishlists/[permalink]/items/[itemId]/claim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should emit socket event when claim is removed successfully", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/db");
    const { PartyKitEventEmitter } = await import("@/lib/partykit");

    // Mock session
    const mockSession = {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    // Mock wishlist item
    const mockItem = {
      id: "item-1",
      name: "Test Item",
      wishlist: {
        id: "wishlist-1",
        ownerId: "user-2",
        privacy: "PUBLIC",
      },
    } as any;

    vi.mocked(prisma.wishlistItem.findFirst).mockResolvedValue(mockItem);

    // Mock permission check
    mockPermissionService.hasPermission.mockResolvedValue(true);

    // Mock existing claim
    const mockClaim = {
      id: "claim-1",
      userId: "user-1",
      itemId: "item-1",
      wishlistId: "wishlist-1",
      user: {
        id: "user-1",
        name: "Test User",
        image: null,
      },
    } as any;

    vi.mocked(prisma.claim.findFirst).mockResolvedValue(mockClaim);
    vi.mocked(prisma.claim.delete).mockResolvedValue(mockClaim);

    // Create request
    const request = new NextRequest("http://localhost:3000/api/wishlists/test/items/item-1/claim", {
      method: "DELETE",
    });

    // Mock params
    const params = Promise.resolve({
      permalink: "test",
      itemId: "item-1",
    });

    // Call the route handler
    const response = await DELETE(request, { params });

    // Assertions
    expect(response.status).toBe(200);

    // Should delete the claim
    expect(prisma.claim.delete).toHaveBeenCalledWith({
      where: { id: "claim-1" },
    });

    // Should emit socket event
    expect(PartyKitEventEmitter.emitToWishlist).toHaveBeenCalledWith(
      "wishlist-1",
      "claim:removed",
      {
        itemId: "item-1",
        wishlistId: "wishlist-1",
        userId: "user-1",
      }
    );

    // Response should indicate success
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.claim).toEqual(mockClaim);
  });

  it("should not emit socket event when claim not found", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/db");
    const { PartyKitEventEmitter } = await import("@/lib/partykit");

    // Mock session
    const mockSession = {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    // Mock wishlist item
    const mockItem = {
      id: "item-1",
      name: "Test Item",
      wishlist: {
        id: "wishlist-1",
        ownerId: "user-2",
        privacy: "PUBLIC",
      },
    } as any;

    vi.mocked(prisma.wishlistItem.findFirst).mockResolvedValue(mockItem);

    // Mock permission check
    mockPermissionService.hasPermission.mockResolvedValue(true);

    // Mock no existing claim
    vi.mocked(prisma.claim.findFirst).mockResolvedValue(null);

    // Create request
    const request = new NextRequest("http://localhost:3000/api/wishlists/test/items/item-1/claim", {
      method: "DELETE",
    });

    // Mock params
    const params = Promise.resolve({
      permalink: "test",
      itemId: "item-1",
    });

    // Call the route handler
    const response = await DELETE(request, { params });

    // Should return error
    expect(response.status).toBe(404);

    // Should not emit socket event
    expect(PartyKitEventEmitter.emitToWishlist).not.toHaveBeenCalled();
  });
});
