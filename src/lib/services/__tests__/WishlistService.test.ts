import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateWishlistData, UpdateWishlistData } from "../WishlistService";
import { WishlistService } from "../WishlistService";

// Mock Prisma for unit tests
vi.mock("@/lib/db", () => ({
  prisma: {
    wishlist: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    friendship: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    occasion: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    friendRequest: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock PrivacyService
vi.mock("../PrivacyService", () => ({
  PrivacyService: {
    getInstance: vi.fn(() => ({
      areFriends: vi.fn(),
      redactUserData: vi.fn(),
      redactClaimsUserData: vi.fn(),
    })),
  },
}));

// Mock OccasionService
vi.mock("../OccasionService", () => ({
  OccasionService: {
    getInstance: vi.fn(() => ({
      createOccasion: vi.fn(),
      updateOccasion: vi.fn(),
      getOccasionsByEntity: vi.fn(),
    })),
  },
}));

// Import the mocked modules
import { prisma } from "../../db";
import { PrivacyService } from "../PrivacyService";

// Type definitions for mocked functions
interface MockPrivacyService {
  areFriends: MockedFunction<(userId1: string, userId2: string) => Promise<boolean>>;
  redactUserData: MockedFunction<(userData: unknown, isFriend: boolean) => unknown>;
  redactClaimsUserData: MockedFunction<(claims: unknown[], viewerId: string) => Promise<unknown[]>>;
}

describe("WishlistService", () => {
  let mockPrivacyService: MockPrivacyService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrivacyService = {
      areFriends: vi.fn(),
      redactUserData: vi.fn(),
      redactClaimsUserData: vi.fn(),
    };
    (PrivacyService.getInstance as MockedFunction<() => PrivacyService>).mockReturnValue(
      mockPrivacyService as unknown as PrivacyService
    );

    // Set default mocks for occasions and related models
    (
      prisma.occasion.findMany as unknown as MockedFunction<typeof prisma.occasion.findMany>
    ).mockResolvedValue([]);
    (
      prisma.user.findUnique as unknown as MockedFunction<typeof prisma.user.findUnique>
    ).mockResolvedValue(null);
    (
      prisma.friendRequest.findFirst as unknown as MockedFunction<
        typeof prisma.friendRequest.findFirst
      >
    ).mockResolvedValue(null);

    // Reset the WishlistService singleton instance to ensure it gets the mocked PrivacyService
    WishlistService.resetInstance();
  });

  describe("getUserWishlists", () => {
    it("should fetch user wishlists with items and counts", async () => {
      const mockWishlists = [
        {
          id: "wishlist-1",
          title: "My Wishlist",
          description: "Test description",
          permalink: "my-wishlist",
          privacy: "FRIENDS_ONLY",
          isDefault: true,
          ownerId: "user-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [
            {
              id: "item-1",
              name: "Test Item",
              description: null,
              url: null,
              imageUrl: null,
              price: null,
              currency: "USD",
              priority: 0,
              tags: [],
              isDeleted: false,
              wishlistId: "wishlist-1",
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
            },
          ],
          _count: { items: 1 },
        },
      ];

      (
        prisma.wishlist.findMany as unknown as MockedFunction<typeof prisma.wishlist.findMany>
      ).mockResolvedValue(mockWishlists as unknown as any);

      const result = await WishlistService.getInstance().getUserWishlists("user-1");

      expect(prisma.wishlist.findMany).toHaveBeenCalledWith({
        where: { ownerId: "user-1" },
        include: {
          items: {
            where: { isDeleted: false },
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: { items: { where: { isDeleted: false } } },
          },
        },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      });

      expect(result).toEqual(mockWishlists);
    });
  });

  describe("getWishlistByPermalink", () => {
    it("should return wishlist for public privacy", async () => {
      const basicWishlist = {
        id: "wishlist-1",
        ownerId: "user-1",
        privacy: "PUBLIC",
      };

      const mockWishlist = {
        id: "wishlist-1",
        title: "Public Wishlist",
        description: "Public test",
        permalink: "public-wishlist",
        privacy: "PUBLIC",
        isDefault: false,
        ownerId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: {
          id: "user-1",
          name: "John Doe",
          email: "john@example.com",
          image: null,
        },
        items: [],
      };

      (prisma.wishlist.findUnique as unknown as MockedFunction<typeof prisma.wishlist.findUnique>)
        .mockResolvedValueOnce(basicWishlist as unknown as any)
        .mockResolvedValueOnce(mockWishlist as unknown as any);

      const result = await WishlistService.getInstance().getWishlistByPermalink(
        "public-wishlist",
        "user-2"
      );

      expect(result).toEqual({ ...mockWishlist, occasions: [], friendshipStatus: "none" });
    });

    it("should return null for private wishlist when not owner", async () => {
      const basicWishlist = {
        id: "wishlist-1",
        privacy: "PRIVATE",
        ownerId: "user-1",
      };

      const mockWishlist = {
        id: "wishlist-1",
        privacy: "PRIVATE",
        ownerId: "user-1",
        owner: { id: "user-1", name: "John Doe", image: null },
        items: [],
      };

      (prisma.wishlist.findUnique as unknown as MockedFunction<typeof prisma.wishlist.findUnique>)
        .mockResolvedValueOnce(basicWishlist as unknown as any)
        .mockResolvedValueOnce(mockWishlist as unknown as any);

      const result = await WishlistService.getInstance().getWishlistByPermalink(
        "private-wishlist",
        "user-2"
      );

      expect(result).toBeNull();
      expect(prisma.wishlist.findUnique).toHaveBeenCalledTimes(2); // Both queries are made, then privacy check fails
    });

    it("should return private wishlist when user is owner", async () => {
      const basicWishlist = {
        id: "wishlist-1",
        privacy: "PRIVATE",
        ownerId: "user-1",
      };

      const mockWishlist = {
        id: "wishlist-1",
        privacy: "PRIVATE",
        ownerId: "user-1",
        owner: { id: "user-1", name: "John Doe", image: null },
        items: [],
      };

      (prisma.wishlist.findUnique as unknown as MockedFunction<typeof prisma.wishlist.findUnique>)
        .mockResolvedValueOnce(basicWishlist as unknown as any)
        .mockResolvedValueOnce(mockWishlist as unknown as any);

      const result = await WishlistService.getInstance().getWishlistByPermalink(
        "private-wishlist",
        "user-1"
      );

      expect(result).toEqual({ ...mockWishlist, occasions: [], friendshipStatus: "none" });
    });

    it("should return friends-only wishlist when users are friends", async () => {
      const basicWishlist = {
        id: "wishlist-1",
        ownerId: "user-1",
        privacy: "FRIENDS_ONLY",
      };

      const mockWishlist = {
        id: "wishlist-1",
        privacy: "FRIENDS_ONLY",
        ownerId: "user-1",
        owner: { id: "user-1", name: "John Doe", image: null },
        items: [],
      };

      const mockFriendship = {
        id: "friendship-1",
        userId: "user-1",
        friendId: "user-2",
        createdAt: new Date(),
      };

      (prisma.wishlist.findUnique as unknown as MockedFunction<typeof prisma.wishlist.findUnique>)
        .mockResolvedValueOnce(basicWishlist as unknown as any)
        .mockResolvedValueOnce(mockWishlist as unknown as any);
      (
        prisma.friendship.findFirst as unknown as MockedFunction<typeof prisma.friendship.findFirst>
      ).mockResolvedValue(mockFriendship);

      const result = await WishlistService.getInstance().getWishlistByPermalink(
        "friends-wishlist",
        "user-2"
      );

      expect(prisma.friendship.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { userId: "user-1", friendId: "user-2" },
            { userId: "user-2", friendId: "user-1" },
          ],
        },
      });

      expect(result).toEqual({ ...mockWishlist, occasions: [], friendshipStatus: "friends" });
    });

    it("should return null for friends-only wishlist when users are not friends", async () => {
      const basicWishlist = {
        id: "wishlist-1",
        ownerId: "user-1",
        privacy: "FRIENDS_ONLY",
      };

      const mockWishlist = {
        id: "wishlist-1",
        privacy: "FRIENDS_ONLY",
        ownerId: "user-1",
        owner: { id: "user-1", name: "John Doe", image: null },
        items: [],
      };

      (prisma.wishlist.findUnique as unknown as MockedFunction<typeof prisma.wishlist.findUnique>)
        .mockResolvedValueOnce(basicWishlist as unknown as any)
        .mockResolvedValueOnce(mockWishlist as unknown as any);
      (
        prisma.friendship.findFirst as unknown as MockedFunction<typeof prisma.friendship.findFirst>
      ).mockResolvedValue(null);

      const result = await WishlistService.getInstance().getWishlistByPermalink(
        "friends-wishlist",
        "user-2"
      );

      expect(result).toBeNull();
    });

    it("should return null when wishlist does not exist", async () => {
      (
        prisma.wishlist.findUnique as unknown as MockedFunction<typeof prisma.wishlist.findUnique>
      ).mockResolvedValueOnce(null as unknown as any);

      const result = await WishlistService.getInstance().getWishlistByPermalink(
        "nonexistent",
        "user-1"
      );

      expect(result).toBeNull();
      expect(prisma.wishlist.findUnique).toHaveBeenCalledTimes(1); // Only basic query, since wishlist doesn't exist
    });

    it("should not include claims in items when no viewerId provided", async () => {
      const basicWishlist = {
        id: "wishlist-1",
        ownerId: "user-1",
        privacy: "PUBLIC",
      };

      const mockWishlist = {
        id: "wishlist-1",
        privacy: "PUBLIC",
        ownerId: "user-1",
        owner: { id: "user-1", name: "John Doe", image: null },
        items: [],
      };

      (prisma.wishlist.findUnique as unknown as MockedFunction<typeof prisma.wishlist.findUnique>)
        .mockResolvedValueOnce(basicWishlist as unknown as any) // First call for basic info
        .mockResolvedValueOnce(mockWishlist as unknown as any); // Second call for full data

      await WishlistService.getInstance().getWishlistByPermalink("public-wishlist");

      expect(prisma.wishlist.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.wishlist.findUnique).toHaveBeenNthCalledWith(2, {
        where: { permalink: "public-wishlist" },
        include: {
          owner: {
            select: { id: true, name: true, image: true },
          },
          items: {
            where: { isDeleted: false },
            include: {
              claims: false,
            },
            orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
          },
        },
      });
    });

    it("should not include claims when owner views own wishlist", async () => {
      const basicWishlist = {
        id: "wishlist-1",
        ownerId: "user-1",
        privacy: "PUBLIC",
      };

      const mockWishlist = {
        id: "wishlist-1",
        privacy: "PUBLIC",
        ownerId: "user-1",
        owner: { id: "user-1", name: "John Doe", image: null },
        items: [],
      };

      (prisma.wishlist.findUnique as unknown as MockedFunction<typeof prisma.wishlist.findUnique>)
        .mockResolvedValueOnce(basicWishlist as unknown as any) // First call for basic info
        .mockResolvedValueOnce(mockWishlist as unknown as any); // Second call for full data

      await WishlistService.getInstance().getWishlistByPermalink("public-wishlist", "user-1");

      expect(prisma.wishlist.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.wishlist.findUnique).toHaveBeenNthCalledWith(2, {
        where: { permalink: "public-wishlist" },
        include: {
          owner: {
            select: { id: true, name: true, image: true },
          },
          items: {
            where: { isDeleted: false },
            include: {
              claims: false, // Should be false when owner views own wishlist
            },
            orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
          },
        },
      });
    });

    it("should include claims when non-owner views wishlist", async () => {
      const basicWishlist = {
        id: "wishlist-1",
        ownerId: "user-1",
        privacy: "PUBLIC",
      };

      const mockWishlist = {
        id: "wishlist-1",
        privacy: "PUBLIC",
        ownerId: "user-1",
        owner: { id: "user-1", name: "John Doe", image: null },
        items: [],
      };

      (prisma.wishlist.findUnique as unknown as MockedFunction<typeof prisma.wishlist.findUnique>)
        .mockResolvedValueOnce(basicWishlist as unknown as any) // First call for basic info
        .mockResolvedValueOnce(mockWishlist as unknown as any); // Second call for full data

      await WishlistService.getInstance().getWishlistByPermalink("public-wishlist", "user-2");

      expect(prisma.wishlist.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.wishlist.findUnique).toHaveBeenNthCalledWith(2, {
        where: { permalink: "public-wishlist" },
        include: {
          owner: {
            select: { id: true, name: true, image: true },
          },
          items: {
            where: { isDeleted: false },
            include: {
              claims: {
                include: {
                  user: {
                    select: { id: true, name: true, image: true },
                  },
                },
              },
            },
            orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
          },
        },
      });
    });
  });

  describe("createWishlist", () => {
    it("should create wishlist with generated permalink", async () => {
      const mockCreatedWishlist = {
        id: "wishlist-1",
        title: "My Test Wishlist",
        description: "Test description",
        permalink: "my-test-wishlist",
        privacy: "FRIENDS_ONLY",
        isDefault: false,
        ownerId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        _count: { items: 0 },
      };

      (
        prisma.wishlist.findUnique as unknown as MockedFunction<typeof prisma.wishlist.findUnique>
      ).mockResolvedValue(null as unknown as any); // Permalink available
      (
        prisma.wishlist.create as unknown as MockedFunction<typeof prisma.wishlist.create>
      ).mockResolvedValue(mockCreatedWishlist as unknown as any);

      const wishlistData: CreateWishlistData = {
        title: "My Test Wishlist!@#$%",
        description: "Test description",
        privacy: "FRIENDS_ONLY",
        isDefault: false,
      };

      const result = await WishlistService.getInstance().createWishlist("user-1", wishlistData);

      expect(prisma.wishlist.findUnique).toHaveBeenCalledWith({
        where: { permalink: "my-test-wishlist" },
      });

      expect(prisma.wishlist.create).toHaveBeenCalledWith({
        data: {
          title: "My Test Wishlist!@#$%",
          description: "Test description",
          privacy: "FRIENDS_ONLY",
          isDefault: false,
          permalink: "my-test-wishlist",
          ownerId: "user-1",
        },
        include: {
          items: {
            where: { isDeleted: false },
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: { items: { where: { isDeleted: false } } },
          },
        },
      });

      expect(result).toEqual(mockCreatedWishlist);
    });

    it("should generate unique permalink when collision occurs", async () => {
      const mockCreatedWishlist = {
        id: "wishlist-1",
        title: "Test",
        permalink: "test-1",
        privacy: "PUBLIC",
        isDefault: false,
        ownerId: "user-1",
        items: [],
        _count: { items: 0 },
      };

      (prisma.wishlist.findUnique as unknown as MockedFunction<typeof prisma.wishlist.findUnique>)
        .mockResolvedValueOnce({ id: "existing-1" } as unknown as any) // "test" exists
        .mockResolvedValueOnce(null); // "test-1" available

      (
        prisma.wishlist.create as unknown as MockedFunction<typeof prisma.wishlist.create>
      ).mockResolvedValue(mockCreatedWishlist as unknown as any);

      const wishlistData: CreateWishlistData = {
        title: "Test",
        privacy: "PUBLIC",
      };

      await WishlistService.getInstance().createWishlist("user-1", wishlistData);

      expect(prisma.wishlist.findUnique).toHaveBeenCalledWith({ where: { permalink: "test" } });
      expect(prisma.wishlist.findUnique).toHaveBeenCalledWith({ where: { permalink: "test-1" } });

      expect(prisma.wishlist.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          permalink: "test-1",
        }),
        include: expect.any(Object),
      });
    });

    it("should unset other default wishlists when creating new default", async () => {
      const mockCreatedWishlist = {
        id: "wishlist-1",
        title: "New Default",
        permalink: "new-default",
        privacy: "PRIVATE",
        isDefault: true,
        ownerId: "user-1",
        items: [],
        _count: { items: 0 },
      };

      (
        prisma.wishlist.findUnique as unknown as MockedFunction<typeof prisma.wishlist.findUnique>
      ).mockResolvedValue(null as unknown as any);
      (
        prisma.wishlist.updateMany as unknown as MockedFunction<typeof prisma.wishlist.updateMany>
      ).mockResolvedValue({ count: 1 });
      (
        prisma.wishlist.create as unknown as MockedFunction<typeof prisma.wishlist.create>
      ).mockResolvedValue(mockCreatedWishlist as unknown as any);

      const wishlistData: CreateWishlistData = {
        title: "New Default",
        privacy: "PRIVATE",
        isDefault: true,
      };

      await WishlistService.getInstance().createWishlist("user-1", wishlistData);

      expect(prisma.wishlist.updateMany).toHaveBeenCalledWith({
        where: { ownerId: "user-1", isDefault: true },
        data: { isDefault: false },
      });
    });

    it("should handle very long titles by truncating permalink", async () => {
      const longTitle = "A".repeat(100);
      const expectedPermalink = "a".repeat(50);

      (
        prisma.wishlist.findUnique as unknown as MockedFunction<typeof prisma.wishlist.findUnique>
      ).mockResolvedValue(null as unknown as any);
      (
        prisma.wishlist.create as unknown as MockedFunction<typeof prisma.wishlist.create>
      ).mockResolvedValue({} as unknown as any);

      const wishlistData: CreateWishlistData = {
        title: longTitle,
        privacy: "PUBLIC",
      };

      await WishlistService.getInstance().createWishlist("user-1", wishlistData);

      expect(prisma.wishlist.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          permalink: expectedPermalink,
        }),
        include: expect.any(Object),
      });
    });
  });

  describe("updateWishlist", () => {
    it("should update wishlist when user is owner", async () => {
      const mockWishlist = {
        id: "wishlist-1",
        ownerId: "user-1",
      };

      const mockUpdatedWishlist = {
        id: "wishlist-1",
        title: "Updated Title",
        description: "Updated description",
        privacy: "PUBLIC",
        isDefault: false,
        ownerId: "user-1",
        items: [],
        _count: { items: 0 },
      };

      (
        prisma.wishlist.findFirst as unknown as MockedFunction<typeof prisma.wishlist.findFirst>
      ).mockResolvedValue(mockWishlist as unknown as any);
      (
        prisma.wishlist.update as unknown as MockedFunction<typeof prisma.wishlist.update>
      ).mockResolvedValue(mockUpdatedWishlist as unknown as any);

      const updateData: UpdateWishlistData = {
        title: "Updated Title",
        description: "Updated description",
        privacy: "PUBLIC",
      };

      const result = await WishlistService.getInstance().updateWishlist(
        "wishlist-1",
        "user-1",
        updateData
      );

      expect(prisma.wishlist.findFirst).toHaveBeenCalledWith({
        where: { id: "wishlist-1", ownerId: "user-1" },
      });

      expect(prisma.wishlist.update).toHaveBeenCalledWith({
        where: { id: "wishlist-1" },
        data: updateData,
        include: {
          items: {
            where: { isDeleted: false },
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: { items: { where: { isDeleted: false } } },
          },
        },
      });

      expect(result).toEqual(mockUpdatedWishlist);
    });

    it("should return null when user is not owner", async () => {
      (
        prisma.wishlist.findFirst as unknown as MockedFunction<typeof prisma.wishlist.findFirst>
      ).mockResolvedValue(null as unknown as any);

      const updateData: UpdateWishlistData = {
        title: "Updated Title",
      };

      const result = await WishlistService.getInstance().updateWishlist(
        "wishlist-1",
        "user-2",
        updateData
      );

      expect(prisma.wishlist.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should unset other defaults when setting isDefault to true", async () => {
      const mockWishlist = {
        id: "wishlist-1",
        ownerId: "user-1",
      };

      const mockUpdatedWishlist = {
        id: "wishlist-1",
        isDefault: true,
        ownerId: "user-1",
      };

      (
        prisma.wishlist.findFirst as unknown as MockedFunction<typeof prisma.wishlist.findFirst>
      ).mockResolvedValue(mockWishlist as unknown as any);
      (
        prisma.wishlist.updateMany as unknown as MockedFunction<typeof prisma.wishlist.updateMany>
      ).mockResolvedValue({ count: 1 });
      (
        prisma.wishlist.update as unknown as MockedFunction<typeof prisma.wishlist.update>
      ).mockResolvedValue(mockUpdatedWishlist as unknown as any);

      const updateData: UpdateWishlistData = {
        isDefault: true,
      };

      await WishlistService.getInstance().updateWishlist("wishlist-1", "user-1", updateData);

      expect(prisma.wishlist.updateMany).toHaveBeenCalledWith({
        where: { ownerId: "user-1", isDefault: true },
        data: { isDefault: false },
      });
    });
  });

  describe("deleteWishlist", () => {
    it("should delete wishlist when user is owner and it's not the only one", async () => {
      const mockWishlist = {
        id: "wishlist-1",
        ownerId: "user-1",
        isDefault: false,
      };

      const mockDeletedWishlist = {
        id: "wishlist-1",
        title: "Deleted Wishlist",
        isDeleted: true,
        deletedAt: new Date(),
      };

      (
        prisma.wishlist.findFirst as unknown as MockedFunction<typeof prisma.wishlist.findFirst>
      ).mockResolvedValue(mockWishlist as unknown as any);
      (
        prisma.wishlist.update as unknown as MockedFunction<typeof prisma.wishlist.update>
      ).mockResolvedValue(mockDeletedWishlist as unknown as any);

      const result = await WishlistService.getInstance().deleteWishlist("wishlist-1", "user-1");

      expect(prisma.wishlist.findFirst).toHaveBeenCalledWith({
        where: { id: "wishlist-1", ownerId: "user-1", isDeleted: false },
      });

      expect(prisma.wishlist.update).toHaveBeenCalledWith({
        where: { id: "wishlist-1" },
        data: { isDeleted: true, deletedAt: expect.any(Date) },
      });

      expect(result).toEqual(mockDeletedWishlist);
    });

    it("should return null when user is not owner", async () => {
      (
        prisma.wishlist.findFirst as unknown as MockedFunction<typeof prisma.wishlist.findFirst>
      ).mockResolvedValue(null as unknown as any);

      const result = await WishlistService.getInstance().deleteWishlist("wishlist-1", "user-2");

      expect(prisma.wishlist.delete).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should throw error when trying to delete the only wishlist", async () => {
      const mockWishlist = {
        id: "wishlist-1",
        ownerId: "user-1",
        isDefault: true,
      };

      (
        prisma.wishlist.findFirst as unknown as MockedFunction<typeof prisma.wishlist.findFirst>
      ).mockResolvedValue(mockWishlist as unknown as any);
      (
        prisma.wishlist.findMany as unknown as MockedFunction<typeof prisma.wishlist.findMany>
      ).mockResolvedValue([] as unknown as any); // No other wishlists

      await expect(
        WishlistService.getInstance().deleteWishlist("wishlist-1", "user-1")
      ).rejects.toThrow("Cannot delete the only wishlist");
    });

    it("should set another wishlist as default when deleting default wishlist", async () => {
      const mockWishlist = {
        id: "wishlist-1",
        ownerId: "user-1",
        isDefault: true,
      };

      const otherWishlists = [
        { id: "wishlist-2", ownerId: "user-1", isDefault: false },
        { id: "wishlist-3", ownerId: "user-1", isDefault: false },
      ];

      const mockDeletedWishlist = {
        id: "wishlist-1",
        isDeleted: true,
        deletedAt: new Date(),
      };

      (
        prisma.wishlist.findFirst as unknown as MockedFunction<typeof prisma.wishlist.findFirst>
      ).mockResolvedValue(mockWishlist as unknown as any);
      (
        prisma.wishlist.findMany as unknown as MockedFunction<typeof prisma.wishlist.findMany>
      ).mockResolvedValue(otherWishlists as unknown as any);
      (prisma.wishlist.update as unknown as MockedFunction<typeof prisma.wishlist.update>)
        .mockResolvedValueOnce(otherWishlists[0] as unknown as any)
        .mockResolvedValueOnce(mockDeletedWishlist as unknown as any);

      await WishlistService.getInstance().deleteWishlist("wishlist-1", "user-1");

      expect(prisma.wishlist.findMany).toHaveBeenCalledWith({
        where: { ownerId: "user-1", id: { not: "wishlist-1" }, isDeleted: false },
      });

      expect(prisma.wishlist.update).toHaveBeenCalledWith({
        where: { id: "wishlist-2" },
        data: { isDefault: true },
      });

      expect(prisma.wishlist.update).toHaveBeenCalledWith({
        where: { id: "wishlist-1" },
        data: { isDeleted: true, deletedAt: expect.any(Date) },
      });
    });
  });

  describe("Privacy Integration", () => {
    describe("getWishlistByPermalink with privacy redaction", () => {
      it("should redact owner data for non-friends on friends-only wishlist", async () => {
        const basicWishlist = {
          id: "wishlist-1",
          ownerId: "user-1",
          privacy: "FRIENDS_ONLY",
        };

        const owner = {
          id: "user-1",
          name: "John Doe",
          image: "avatar.jpg",
        };
        const mockWishlist = {
          id: "wishlist-1",
          title: "Friends Only Wishlist",
          privacy: "FRIENDS_ONLY",
          ownerId: "user-1",
          owner,
          items: [],
        };

        (prisma.wishlist.findUnique as unknown as MockedFunction<typeof prisma.wishlist.findUnique>)
          .mockResolvedValueOnce(basicWishlist as unknown as any)
          .mockResolvedValueOnce(mockWishlist as unknown as any);
        // First friendship.findFirst call for privacy check (in getWishlistByPermalink line ~119)
        (
          prisma.friendship.findFirst as unknown as MockedFunction<
            typeof prisma.friendship.findFirst
          >
        )
          .mockResolvedValueOnce({ id: "friendship-1" } as unknown as any) // Friends for access check
          .mockResolvedValueOnce(null); // Not friends for friendshipStatus calculation
        mockPrivacyService.redactUserData.mockReturnValue(null); // Redact for non-friend

        const result = await WishlistService.getInstance().getWishlistByPermalink(
          "friends-wishlist",
          "user-2" // Different user (non-friend for redaction)
        );

        expect(mockPrivacyService.redactUserData).toHaveBeenCalledWith(
          owner,
          false // isFriend for privacy check
        );
        expect(result?.owner).toBeNull();
      });

      it("should not redact owner data for friends on friends-only wishlist", async () => {
        const basicWishlist = {
          id: "wishlist-1",
          ownerId: "user-1",
          privacy: "FRIENDS_ONLY",
        };

        const mockWishlist = {
          id: "wishlist-1",
          privacy: "FRIENDS_ONLY",
          ownerId: "user-1",
          owner: {
            id: "user-1",
            name: "John Doe",
            image: "avatar.jpg",
          },
          items: [],
        };

        (prisma.wishlist.findUnique as unknown as MockedFunction<typeof prisma.wishlist.findUnique>)
          .mockResolvedValueOnce(basicWishlist as unknown as any)
          .mockResolvedValueOnce(mockWishlist as unknown as any);
        // All friendship.findFirst calls should return friendship (they're friends)
        (
          prisma.friendship.findFirst as unknown as MockedFunction<
            typeof prisma.friendship.findFirst
          >
        ).mockResolvedValue({ id: "friendship-1" } as unknown as any); // Friends for all checks
        mockPrivacyService.redactUserData.mockReturnValue(mockWishlist.owner); // Don't redact for friend

        const result = await WishlistService.getInstance().getWishlistByPermalink(
          "friends-wishlist",
          "user-2"
        );

        expect(mockPrivacyService.redactUserData).toHaveBeenCalledWith(mockWishlist.owner, true);
        expect(result?.owner).toEqual(mockWishlist.owner);
      });

      it("should not redact owner data on public wishlists", async () => {
        const basicWishlist = {
          id: "wishlist-1",
          ownerId: "user-1",
          privacy: "PUBLIC",
        };

        const mockWishlist = {
          id: "wishlist-1",
          privacy: "PUBLIC",
          ownerId: "user-1",
          owner: {
            id: "user-1",
            name: "John Doe",
            image: "avatar.jpg",
          },
          items: [],
        };

        (prisma.wishlist.findUnique as unknown as MockedFunction<typeof prisma.wishlist.findUnique>)
          .mockResolvedValueOnce(basicWishlist as unknown as any)
          .mockResolvedValueOnce(mockWishlist as unknown as any);

        const result = await WishlistService.getInstance().getWishlistByPermalink(
          "public-wishlist",
          "user-2"
        );

        // Privacy service should not be called for public wishlists
        expect(mockPrivacyService.areFriends).not.toHaveBeenCalled();
        expect(mockPrivacyService.redactUserData).not.toHaveBeenCalled();
        expect(result?.owner).toEqual(mockWishlist.owner);
      });

      it("should not redact owner data when viewing own wishlist", async () => {
        const basicWishlist = {
          id: "wishlist-1",
          ownerId: "user-1",
          privacy: "PRIVATE",
        };

        const mockWishlist = {
          id: "wishlist-1",
          privacy: "PRIVATE",
          ownerId: "user-1",
          owner: {
            id: "user-1",
            name: "John Doe",
            image: "avatar.jpg",
          },
          items: [],
        };

        (prisma.wishlist.findUnique as unknown as MockedFunction<typeof prisma.wishlist.findUnique>)
          .mockResolvedValueOnce(basicWishlist as unknown as any)
          .mockResolvedValueOnce(mockWishlist as unknown as any);

        const result = await WishlistService.getInstance().getWishlistByPermalink(
          "private-wishlist",
          "user-1" // Same user as owner
        );

        // Privacy service should not be called when viewing own wishlist
        expect(mockPrivacyService.areFriends).not.toHaveBeenCalled();
        expect(mockPrivacyService.redactUserData).not.toHaveBeenCalled();
        expect(result?.owner).toEqual(mockWishlist.owner);
      });
    });

    describe("getWishlistByPermalink with claims privacy redaction", () => {
      it("should properly handle claims data privacy when viewerId is provided", async () => {
        const basicWishlist = {
          id: "wishlist-1",
          ownerId: "user-1",
          privacy: "PUBLIC",
        };

        const mockWishlist = {
          id: "wishlist-1",
          privacy: "PUBLIC",
          ownerId: "user-1",
          owner: {
            id: "user-1",
            name: "Owner",
            image: null,
          },
          items: [
            {
              id: "item-1",
              name: "Test Item",
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
                {
                  id: "claim-2",
                  userId: "user-3",
                  itemId: "item-1",
                  wishlistId: "wishlist-1",
                  createdAt: new Date(),
                  user: {
                    id: "user-3",
                    name: "Non-Friend User",
                    image: null,
                  },
                },
              ],
            },
          ],
        };

        const mockRedactedClaims = [
          {
            id: "claim-1",
            userId: "user-2",
            itemId: "item-1",
            wishlistId: "wishlist-1",
            createdAt: mockWishlist.items[0].claims[0].createdAt,
            user: {
              id: "user-2",
              name: "Friend User",
              email: "friend@example.com",
              image: null,
            }, // Friend - not redacted
          },
          {
            id: "claim-2",
            userId: "user-3",
            itemId: "item-1",
            wishlistId: "wishlist-1",
            createdAt: mockWishlist.items[0].claims[1].createdAt,
            user: null, // Non-friend - redacted
          },
        ];

        (prisma.wishlist.findUnique as unknown as MockedFunction<typeof prisma.wishlist.findUnique>)
          .mockResolvedValueOnce(basicWishlist as unknown as any)
          .mockResolvedValueOnce(mockWishlist as unknown as any);
        mockPrivacyService.areFriends.mockResolvedValue(false); // Not friends with owner
        mockPrivacyService.redactUserData.mockReturnValue(null); // Redact owner
        mockPrivacyService.redactClaimsUserData.mockResolvedValue(mockRedactedClaims);

        const result = await WishlistService.getInstance().getWishlistByPermalink(
          "public-wishlist",
          "viewer-1"
        );

        // Verify the PrivacyService redaction was applied
        expect(mockPrivacyService.redactClaimsUserData).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              id: "claim-1",
              userId: "user-2",
              user: expect.objectContaining({ id: "user-2" }),
            }),
            expect.objectContaining({
              id: "claim-2",
              userId: "user-3",
              user: expect.objectContaining({ id: "user-3" }),
            }),
          ]),
          "viewer-1"
        );
        expect(result?.items[0].claims).toEqual(mockRedactedClaims);
      });

      it("should not include claims data when no viewerId provided", async () => {
        const basicWishlist = {
          id: "wishlist-1",
          ownerId: "user-1",
          privacy: "PUBLIC",
        };

        const mockWishlist = {
          id: "wishlist-1",
          privacy: "PUBLIC",
          ownerId: "user-1",
          owner: {
            id: "user-1",
            name: "Owner",
            image: null,
          },
          items: [
            {
              id: "item-1",
              name: "Test Item",
              // No claims included when viewerId not provided
            },
          ],
        };

        (prisma.wishlist.findUnique as unknown as MockedFunction<typeof prisma.wishlist.findUnique>)
          .mockResolvedValueOnce(basicWishlist as unknown as any)
          .mockResolvedValueOnce(mockWishlist as unknown as any);
        mockPrivacyService.redactUserData.mockReturnValue(mockWishlist.owner);

        const result = await WishlistService.getInstance().getWishlistByPermalink(
          "public-wishlist"
          // No viewerId provided
        );

        // Verify claims query was set to false on second call
        expect(prisma.wishlist.findUnique).toHaveBeenCalledTimes(2);
        expect(prisma.wishlist.findUnique).toHaveBeenNthCalledWith(2, {
          where: { permalink: "public-wishlist" },
          include: {
            owner: {
              select: { id: true, name: true, image: true },
            },
            items: {
              where: { isDeleted: false },
              include: {
                claims: false, // Should be false when no viewerId
              },
              orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
            },
          },
        });

        expect(result?.items[0]).not.toHaveProperty("claims");
      });
    });
  });
});
