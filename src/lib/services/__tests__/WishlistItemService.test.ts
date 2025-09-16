import { beforeEach, describe, expect, it, vi } from "vitest";
import { WishlistItemService } from "../WishlistItemService";
import type { CreateWishlistItemData, UpdateWishlistItemData } from "../WishlistItemService";

// Mock Prisma for unit tests
vi.mock("@/lib/db", () => ({
  prisma: {
    wishlistItem: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    claim: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    friendship: {
      findMany: vi.fn(),
    },
  },
}));

// Mock PrivacyService
vi.mock("../PrivacyService", () => ({
  PrivacyService: {
    getInstance: vi.fn(() => ({
      redactClaimsUserData: vi.fn(),
    })),
  },
}));

// Import the mocked modules
import { prisma } from "@/lib/db";
import { PrivacyService } from "../PrivacyService";

describe("WishlistItemService", () => {
  let mockPrivacyService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrivacyService = {
      redactClaimsUserData: vi.fn(),
    };
    (PrivacyService.getInstance as any).mockReturnValue(mockPrivacyService);
  });

  describe("getItemById", () => {
    it("should fetch wishlist item with basic data when no viewerId provided", async () => {
      const mockItem = {
        id: "item-1",
        name: "Test Item",
        description: "Test description",
        url: "https://example.com",
        imageUrl: "https://example.com/image.jpg",
        price: 99.99,
        currency: "USD",
        priority: 3,
        tags: ["tag1", "tag2"],
        isDeleted: false,
        wishlistId: "wishlist-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        wishlist: {
          id: "wishlist-1",
          title: "My Wishlist",
          owner: {
            id: "user-1",
            name: "John Doe",
            email: "john@example.com",
            image: null,
          },
        },
      };

      (prisma.wishlistItem.findUnique as any).mockResolvedValue(mockItem);

      const result = await WishlistItemService.getInstance().getItemById("item-1");

      expect(prisma.wishlistItem.findUnique).toHaveBeenCalledWith({
        where: { id: "item-1" },
        include: {
          claims: false,
          wishlist: {
            select: {
              id: true,
              title: true,
              owner: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      });

      expect(result).toEqual(mockItem);
      expect(mockPrivacyService.redactClaimsUserData).not.toHaveBeenCalled();
    });

    it("should fetch wishlist item with redacted claims when viewerId provided", async () => {
      const mockItem = {
        id: "item-1",
        name: "Test Item",
        wishlistId: "wishlist-1",
        claims: [
          {
            id: "claim-1",
            userId: "user-2",
            itemId: "item-1",
            wishlistId: "wishlist-1",
            createdAt: new Date(),
            user: {
              id: "user-2",
              name: "Friend User",
              email: "friend@example.com",
              image: null,
            },
          },
        ],
        wishlist: {
          id: "wishlist-1",
          title: "My Wishlist",
          owner: {
            id: "user-1",
            name: "John Doe",
            email: "john@example.com",
            image: null,
          },
        },
      };

      const mockRedactedClaims = [
        {
          id: "claim-1",
          userId: "user-2",
          itemId: "item-1",
          wishlistId: "wishlist-1",
          createdAt: mockItem.claims[0].createdAt,
          user: null, // Redacted
        },
      ];

      (prisma.wishlistItem.findUnique as any).mockResolvedValue(mockItem);
      mockPrivacyService.redactClaimsUserData.mockResolvedValue(mockRedactedClaims);

      const result = await WishlistItemService.getInstance().getItemById("item-1", "viewer-1");

      expect(prisma.wishlistItem.findUnique).toHaveBeenCalledWith({
        where: { id: "item-1" },
        include: {
          claims: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          wishlist: {
            select: {
              id: true,
              title: true,
              owner: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      });

      expect(mockPrivacyService.redactClaimsUserData).toHaveBeenCalledWith(
        mockItem.claims,
        "viewer-1"
      );

      expect(result).toEqual({
        ...mockItem,
        claims: mockRedactedClaims,
      });
    });

    it("should return null when item does not exist", async () => {
      (prisma.wishlistItem.findUnique as any).mockResolvedValue(null);

      const result = await WishlistItemService.getInstance().getItemById("nonexistent");

      expect(result).toBeNull();
      expect(mockPrivacyService.redactClaimsUserData).not.toHaveBeenCalled();
    });
  });

  describe("createItem", () => {
    it("should create wishlist item", async () => {
      const mockCreatedItem = {
        id: "item-1",
        name: "New Item",
        description: "New description",
        url: "https://example.com",
        imageUrl: "https://example.com/image.jpg",
        price: 149.99,
        currency: "USD",
        priority: 2,
        tags: ["new", "test"],
        isDeleted: false,
        wishlistId: "wishlist-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        claims: [],
        wishlist: {
          id: "wishlist-1",
          title: "My Wishlist",
          owner: {
            id: "user-1",
            name: "John Doe",
            email: "john@example.com",
            image: null,
          },
        },
      };

      (prisma.wishlistItem.create as any).mockResolvedValue(mockCreatedItem);

      const itemData: CreateWishlistItemData = {
        name: "New Item",
        description: "New description",
        url: "https://example.com",
        imageUrl: "https://example.com/image.jpg",
        price: 149.99,
        currency: "USD",
        priority: 2,
        tags: ["new", "test"],
      };

      const result = await WishlistItemService.getInstance().createItem(
        "wishlist-1",
        "user-1", // userId parameter
        itemData
      );

      expect(prisma.wishlistItem.create).toHaveBeenCalledWith({
        data: {
          ...itemData,
          wishlistId: "wishlist-1",
        },
        include: {
          claims: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          wishlist: {
            select: {
              id: true,
              title: true,
              owner: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      });

      expect(result).toEqual(mockCreatedItem);
    });
  });

  describe("updateWishlistItem", () => {
    it("should update wishlist item and apply privacy redaction", async () => {
      const mockUpdatedItem = {
        id: "item-1",
        name: "Updated Item",
        description: "Updated description",
        wishlistId: "wishlist-1",
        claims: [
          {
            id: "claim-1",
            userId: "user-2",
            itemId: "item-1",
            wishlistId: "wishlist-1",
            createdAt: new Date(),
            user: {
              id: "user-2",
              name: "Friend User",
              email: "friend@example.com",
              image: null,
            },
          },
        ],
        wishlist: {
          id: "wishlist-1",
          title: "My Wishlist",
          owner: {
            id: "user-1",
            name: "John Doe",
            email: "john@example.com",
            image: null,
          },
        },
      };

      const mockRedactedClaims = [
        {
          id: "claim-1",
          userId: "user-2",
          itemId: "item-1",
          wishlistId: "wishlist-1",
          createdAt: mockUpdatedItem.claims[0].createdAt,
          user: null, // Redacted
        },
      ];

      (prisma.wishlistItem.update as any).mockResolvedValue(mockUpdatedItem);
      mockPrivacyService.redactClaimsUserData.mockResolvedValue(mockRedactedClaims);

      const updateData: UpdateWishlistItemData = {
        name: "Updated Item",
        description: "Updated description",
      };

      const result = await WishlistItemService.getInstance().updateWishlistItem(
        "item-1",
        updateData,
        "viewer-1"
      );

      expect(prisma.wishlistItem.update).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: updateData,
        include: {
          claims: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          wishlist: {
            select: {
              id: true,
              title: true,
              owner: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      });

      expect(mockPrivacyService.redactClaimsUserData).toHaveBeenCalledWith(
        mockUpdatedItem.claims,
        "viewer-1"
      );

      expect(result).toEqual({
        ...mockUpdatedItem,
        claims: mockRedactedClaims,
      });
    });

    it("should not apply privacy redaction when no viewerId provided", async () => {
      const mockUpdatedItem = {
        id: "item-1",
        name: "Updated Item",
        claims: [],
        wishlist: {
          id: "wishlist-1",
          title: "My Wishlist",
          owner: {
            id: "user-1",
            name: "John Doe",
            email: "john@example.com",
            image: null,
          },
        },
      };

      (prisma.wishlistItem.update as any).mockResolvedValue(mockUpdatedItem);

      const updateData: UpdateWishlistItemData = {
        name: "Updated Item",
      };

      const result = await WishlistItemService.getInstance().updateWishlistItem(
        "item-1",
        updateData
      );

      expect(mockPrivacyService.redactClaimsUserData).not.toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedItem);
    });
  });

  describe("deleteWishlistItem", () => {
    it("should soft delete wishlist item and apply privacy redaction", async () => {
      const mockDeletedItem = {
        id: "item-1",
        name: "Deleted Item",
        isDeleted: true,
        deletedAt: new Date(),
        wishlistId: "wishlist-1",
        claims: [],
        wishlist: {
          id: "wishlist-1",
          title: "My Wishlist",
          owner: {
            id: "user-1",
            name: "John Doe",
            email: "john@example.com",
            image: null,
          },
        },
      };

      (prisma.wishlistItem.update as any).mockResolvedValue(mockDeletedItem);
      mockPrivacyService.redactClaimsUserData.mockResolvedValue([]);

      const result = await WishlistItemService.getInstance().deleteWishlistItem(
        "item-1",
        "viewer-1"
      );

      expect(prisma.wishlistItem.update).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: {
          isDeleted: true,
          deletedAt: expect.any(Date),
        },
        include: {
          claims: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          wishlist: {
            select: {
              id: true,
              title: true,
              owner: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      });

      expect(mockPrivacyService.redactClaimsUserData).toHaveBeenCalledWith(
        mockDeletedItem.claims,
        "viewer-1"
      );

      expect(result).toEqual({
        ...mockDeletedItem,
        claims: [],
      });
    });
  });

  describe("claimItem", () => {
    it("should create claim and return item with redacted claims", async () => {
      const mockClaim = {
        id: "claim-1",
        userId: "user-2",
        itemId: "item-1",
        wishlistId: "wishlist-1",
        createdAt: new Date(),
      };

      const mockItem = {
        id: "item-1",
        name: "Claimed Item",
        wishlistId: "wishlist-1",
        claims: [
          {
            ...mockClaim,
            user: {
              id: "user-2",
              name: "Claimer",
              email: "claimer@example.com",
              image: null,
            },
          },
        ],
        wishlist: {
          id: "wishlist-1",
          title: "My Wishlist",
          owner: {
            id: "user-1",
            name: "John Doe",
            email: "john@example.com",
            image: null,
          },
        },
      };

      const mockRedactedClaims = [
        {
          ...mockClaim,
          user: {
            id: "user-2",
            name: "Claimer",
            email: "claimer@example.com",
            image: null,
          }, // Not redacted for self
        },
      ];

      (prisma.claim.create as any).mockResolvedValue(mockClaim);
      (prisma.wishlistItem.findUnique as any).mockResolvedValue(mockItem);
      mockPrivacyService.redactClaimsUserData.mockResolvedValue(mockRedactedClaims);

      const result = await WishlistItemService.getInstance().claimItem("item-1", "user-2");

      expect(prisma.claim.create).toHaveBeenCalledWith({
        data: {
          userId: "user-2",
          itemId: "item-1",
          wishlistId: "wishlist-1",
        },
      });

      expect(mockPrivacyService.redactClaimsUserData).toHaveBeenCalledWith(
        mockItem.claims,
        "user-2"
      );

      expect(result).toEqual({
        ...mockItem,
        claims: mockRedactedClaims,
      });
    });

    it("should return null when item does not exist", async () => {
      (prisma.wishlistItem.findFirst as any).mockResolvedValue(null);

      const result = await WishlistItemService.getInstance().claimItem("nonexistent", "user-2");

      expect(result).toBeNull();
      expect(prisma.claim.create).not.toHaveBeenCalled();
    });

    it("should return null when user tries to claim their own item", async () => {
      const mockItem = {
        id: "item-1",
        wishlistId: "wishlist-1",
        wishlist: {
          ownerId: "user-1",
        },
      };

      (prisma.wishlistItem.findFirst as any).mockResolvedValue(mockItem);

      const result = await WishlistItemService.getInstance().claimItem(
        "item-1",
        "user-1" // Same as owner
      );

      expect(result).toBeNull();
      expect(prisma.claim.create).not.toHaveBeenCalled();
    });

    it("should return null when user already has a claim", async () => {
      const mockItem = {
        id: "item-1",
        wishlistId: "wishlist-1",
        wishlist: {
          ownerId: "user-1",
        },
      };

      const mockExistingClaim = {
        id: "existing-claim",
        userId: "user-2",
        itemId: "item-1",
      };

      (prisma.wishlistItem.findFirst as any).mockResolvedValue(mockItem);
      (prisma.claim.findFirst as any).mockResolvedValue(mockExistingClaim);

      const result = await WishlistItemService.getInstance().claimItem("item-1", "user-2");

      expect(result).toBeNull();
      expect(prisma.claim.create).not.toHaveBeenCalled();
    });
  });

  describe("unclaimItem", () => {
    it("should delete claim and return item with redacted claims", async () => {
      const mockDeletedClaim = {
        id: "claim-1",
        userId: "user-2",
        itemId: "item-1",
        wishlistId: "wishlist-1",
      };

      const mockItem = {
        id: "item-1",
        name: "Unclaimed Item",
        wishlistId: "wishlist-1",
        claims: [], // No claims after unclaiming
        wishlist: {
          id: "wishlist-1",
          title: "My Wishlist",
          owner: {
            id: "user-1",
            name: "John Doe",
            email: "john@example.com",
            image: null,
          },
        },
      };

      (prisma.claim.delete as any).mockResolvedValue(mockDeletedClaim);
      (prisma.wishlistItem.findUnique as any).mockResolvedValue(mockItem);
      mockPrivacyService.redactClaimsUserData.mockResolvedValue([]);

      const result = await WishlistItemService.getInstance().unclaimItem("item-1", "user-2");

      expect(prisma.claim.delete).toHaveBeenCalledWith({
        where: {
          userId_itemId: {
            userId: "user-2",
            itemId: "item-1",
          },
        },
      });

      expect(mockPrivacyService.redactClaimsUserData).toHaveBeenCalledWith(
        mockItem.claims,
        "user-2"
      );

      expect(result).toEqual({
        ...mockItem,
        claims: [],
      });
    });

    it("should return null when claim does not exist", async () => {
      const mockError = new Error("Record to delete does not exist");
      (prisma.claim.delete as any).mockRejectedValue(mockError);

      const result = await WishlistItemService.getInstance().unclaimItem("item-1", "user-2");

      expect(result).toBeNull();
      expect(mockPrivacyService.redactClaimsUserData).not.toHaveBeenCalled();
    });
  });
});
