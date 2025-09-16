import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateWishlistItemData, UpdateWishlistItemData } from "../../../types";
import { WishlistItemService } from "../WishlistItemService";

// Mock Prisma for unit tests
vi.mock("@/lib/db", () => ({
  prisma: {
    wishlist: {
      findFirst: vi.fn(),
    },
    wishlistItem: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    claim: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
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
      areFriends: vi.fn().mockResolvedValue(false),
      redactUserData: vi
        .fn()
        .mockImplementation((userData, isAllowed) =>
          isAllowed ? userData : { ...userData, name: null, image: null }
        ),
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
          privacy: "PUBLIC",
          ownerId: "user-1",
          owner: {
            id: "user-1",
            name: "John Doe",
            image: null,
          },
        },
        claims: [],
      };

      (prisma.wishlistItem.findFirst as any).mockResolvedValue(mockItem);

      const result = await WishlistItemService.getInstance().getItemById("item-1");

      expect(prisma.wishlistItem.findFirst).toHaveBeenCalledWith({
        where: {
          id: "item-1",
          isDeleted: false,
        },
        include: {
          wishlist: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
          claims: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      expect(result).toEqual(mockItem);
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
              image: null,
            },
          },
        ],
        wishlist: {
          id: "wishlist-1",
          privacy: "PUBLIC",
          ownerId: "user-1",
          owner: {
            id: "user-1",
            name: "John Doe",
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

      const mockRedactedOwner = {
        id: "user-1",
        name: null,
        image: null,
      };

      (prisma.wishlistItem.findFirst as any).mockResolvedValue(mockItem);
      mockPrivacyService.redactClaimsUserData.mockResolvedValue(mockRedactedClaims);
      mockPrivacyService.areFriends.mockResolvedValue(false);
      mockPrivacyService.redactUserData.mockReturnValue(mockRedactedOwner);

      const result = await WishlistItemService.getInstance().getItemById("item-1", "viewer-1");

      expect(mockPrivacyService.redactClaimsUserData).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: "claim-1",
            userId: "user-2",
            itemId: "item-1",
            wishlistId: "wishlist-1",
            user: expect.objectContaining({
              id: "user-2",
              name: "Friend User",
              image: null,
            }),
          }),
        ]),
        "viewer-1"
      );

      expect(mockPrivacyService.areFriends).toHaveBeenCalledWith("viewer-1", "user-1");

      expect(result.claims).toEqual(mockRedactedClaims);
      expect(result.wishlist.owner).toEqual(mockRedactedOwner);
    });

    it("should throw error when item does not exist", async () => {
      (prisma.wishlistItem.findFirst as any).mockResolvedValue(null);

      await expect(WishlistItemService.getInstance().getItemById("nonexistent")).rejects.toThrow(
        "Item not found"
      );
    });
  });

  describe("createItem", () => {
    it("should create wishlist item", async () => {
      const mockWishlist = {
        id: "wishlist-1",
        ownerId: "user-1",
      };

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
      };

      (prisma.wishlist.findFirst as any).mockResolvedValue(mockWishlist);
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
        "user-1",
        itemData
      );

      expect(prisma.wishlist.findFirst).toHaveBeenCalledWith({
        where: {
          id: "wishlist-1",
          ownerId: "user-1",
        },
      });

      expect(prisma.wishlistItem.create).toHaveBeenCalledWith({
        data: {
          name: "New Item",
          description: "New description",
          url: "https://example.com",
          imageUrl: "https://example.com/image.jpg",
          price: expect.any(Object), // Prisma.Decimal
          currency: "USD",
          priority: 2,
          tags: ["new", "test"],
          wishlistId: "wishlist-1",
        },
        include: {
          claims: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      expect(result).toEqual(mockCreatedItem);
    });
  });

  describe("updateItem", () => {
    it("should update wishlist item and apply privacy redaction", async () => {
      const mockExistingItem = {
        id: "item-1",
        isDeleted: false,
        wishlist: {
          ownerId: "user-1",
        },
      };

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
              image: null,
            },
          },
        ],
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

      (prisma.wishlistItem.findFirst as any).mockResolvedValue(mockExistingItem);
      (prisma.wishlistItem.update as any).mockResolvedValue(mockUpdatedItem);
      mockPrivacyService.redactClaimsUserData.mockResolvedValue(mockRedactedClaims);

      const updateData: UpdateWishlistItemData = {
        name: "Updated Item",
        description: "Updated description",
      };

      const result = await WishlistItemService.getInstance().updateItem(
        "item-1",
        "user-1",
        updateData
      );

      expect(prisma.wishlistItem.findFirst).toHaveBeenCalledWith({
        where: {
          id: "item-1",
          isDeleted: false,
        },
        include: {
          wishlist: true,
        },
      });

      expect(prisma.wishlistItem.update).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: {
          name: "Updated Item",
          description: "Updated description",
        },
        include: {
          claims: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      expect(mockPrivacyService.redactClaimsUserData).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: "claim-1",
            userId: "user-2",
            itemId: "item-1",
            wishlistId: "wishlist-1",
            user: expect.objectContaining({
              id: "user-2",
              name: "Friend User",
              image: null,
            }),
          }),
        ]),
        "user-1"
      );

      expect(result).toEqual({
        ...mockUpdatedItem,
        claims: mockRedactedClaims,
      });
    });

    it("should not apply privacy redaction when no claims", async () => {
      const mockExistingItem = {
        id: "item-1",
        isDeleted: false,
        wishlist: {
          ownerId: "user-1",
        },
      };

      const mockUpdatedItem = {
        id: "item-1",
        name: "Updated Item",
        claims: [],
      };

      (prisma.wishlistItem.findFirst as any).mockResolvedValue(mockExistingItem);
      (prisma.wishlistItem.update as any).mockResolvedValue(mockUpdatedItem);

      const updateData: UpdateWishlistItemData = {
        name: "Updated Item",
      };

      const result = await WishlistItemService.getInstance().updateItem(
        "item-1",
        "user-1",
        updateData
      );

      expect(mockPrivacyService.redactClaimsUserData).not.toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedItem);
    });
  });

  describe("deleteItem", () => {
    it("should soft delete wishlist item", async () => {
      const mockExistingItem = {
        id: "item-1",
        isDeleted: false,
        wishlist: {
          ownerId: "user-1",
        },
      };

      const mockDeletedItem = {
        id: "item-1",
        name: "Deleted Item",
        isDeleted: true,
        deletedAt: new Date(),
        wishlistId: "wishlist-1",
      };

      (prisma.wishlistItem.findFirst as any).mockResolvedValue(mockExistingItem);
      (prisma.wishlistItem.update as any).mockResolvedValue(mockDeletedItem);

      const result = await WishlistItemService.getInstance().deleteItem("item-1", "user-1");

      expect(prisma.wishlistItem.findFirst).toHaveBeenCalledWith({
        where: {
          id: "item-1",
          isDeleted: false,
        },
        include: {
          wishlist: true,
        },
      });

      expect(prisma.wishlistItem.update).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: {
          isDeleted: true,
          deletedAt: expect.any(Date),
        },
      });

      expect(result).toEqual(mockDeletedItem);
    });
  });

  describe("claimItem", () => {
    it("should create claim and return claim with user data", async () => {
      const mockItem = {
        id: "item-1",
        name: "Claimed Item",
        wishlistId: "wishlist-1",
        claims: [],
        wishlist: {
          id: "wishlist-1",
          privacy: "PUBLIC",
          ownerId: "user-1",
          owner: {
            id: "user-1",
            name: "John Doe",
            image: null,
          },
        },
      };

      const mockClaim = {
        id: "claim-1",
        userId: "user-2",
        itemId: "item-1",
        wishlistId: "wishlist-1",
        createdAt: new Date(),
        user: {
          id: "user-2",
          name: "Claimer",
          image: null,
        },
        item: {
          id: "item-1",
          name: "Claimed Item",
        },
      };

      // Mock getItemById call
      (prisma.wishlistItem.findFirst as any).mockResolvedValue(mockItem);
      // Mock existing claim check
      (prisma.claim.findFirst as any).mockResolvedValue(null);
      // Mock claim creation
      (prisma.claim.create as any).mockResolvedValue(mockClaim);

      const result = await WishlistItemService.getInstance().claimItem("item-1", "user-2");

      expect(prisma.claim.findFirst).toHaveBeenCalledWith({
        where: {
          itemId: "item-1",
          userId: "user-2",
        },
      });

      expect(prisma.claim.create).toHaveBeenCalledWith({
        data: {
          itemId: "item-1",
          userId: "user-2",
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
          item: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      expect(result).toEqual(mockClaim);
    });

    it("should throw error when item does not exist", async () => {
      (prisma.wishlistItem.findFirst as any).mockResolvedValue(null);

      await expect(
        WishlistItemService.getInstance().claimItem("nonexistent", "user-2")
      ).rejects.toThrow("Item not found");

      expect(prisma.claim.create).not.toHaveBeenCalled();
    });

    it("should throw error when user tries to claim their own item", async () => {
      const mockItem = {
        id: "item-1",
        wishlistId: "wishlist-1",
        claims: [],
        wishlist: {
          id: "wishlist-1",
          privacy: "PUBLIC",
          ownerId: "user-1",
          owner: {
            id: "user-1",
            name: "John Doe",
            image: null,
          },
        },
      };

      (prisma.wishlistItem.findFirst as any).mockResolvedValue(mockItem);

      await expect(
        WishlistItemService.getInstance().claimItem(
          "item-1",
          "user-1" // Same as owner
        )
      ).rejects.toThrow("Cannot claim your own item");

      expect(prisma.claim.create).not.toHaveBeenCalled();
    });

    it("should throw error when user already has a claim", async () => {
      const mockItem = {
        id: "item-1",
        wishlistId: "wishlist-1",
        claims: [],
        wishlist: {
          id: "wishlist-1",
          privacy: "PUBLIC",
          ownerId: "user-1",
          owner: {
            id: "user-1",
            name: "John Doe",
            image: null,
          },
        },
      };

      const mockExistingClaim = {
        id: "existing-claim",
        userId: "user-2",
        itemId: "item-1",
      };

      (prisma.wishlistItem.findFirst as any).mockResolvedValue(mockItem);
      (prisma.claim.findFirst as any).mockResolvedValue(mockExistingClaim);

      await expect(WishlistItemService.getInstance().claimItem("item-1", "user-2")).rejects.toThrow(
        "Item already claimed by you"
      );

      expect(prisma.claim.create).not.toHaveBeenCalled();
    });
  });

  describe("unclaimItem", () => {
    it("should delete claim and return deleted claim", async () => {
      const mockClaim = {
        id: "existing-claim",
        userId: "user-2",
        itemId: "item-1",
        wishlistId: "wishlist-1",
        user: {
          id: "user-2",
          name: "Claimer",
          image: null,
        },
      };

      (prisma.claim.findFirst as any).mockResolvedValue(mockClaim);
      (prisma.claim.delete as any).mockResolvedValue(mockClaim);

      const result = await WishlistItemService.getInstance().unclaimItem("item-1", "user-2");

      expect(prisma.claim.findFirst).toHaveBeenCalledWith({
        where: {
          itemId: "item-1",
          userId: "user-2",
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

      expect(prisma.claim.delete).toHaveBeenCalledWith({
        where: {
          id: "existing-claim",
        },
      });

      expect(result).toEqual(mockClaim);
    });

    it("should throw error when claim does not exist", async () => {
      (prisma.claim.findFirst as any).mockResolvedValue(null);

      await expect(
        WishlistItemService.getInstance().unclaimItem("item-1", "user-2")
      ).rejects.toThrow("Claim not found");

      expect(prisma.claim.delete).not.toHaveBeenCalled();
    });
  });
});
