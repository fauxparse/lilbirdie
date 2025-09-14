import { beforeEach, describe, expect, it, vi } from "vitest";
import { WishlistService } from "../WishlistService";
import type { CreateWishlistData, UpdateWishlistData } from "../WishlistService";

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
    },
  },
}));

// Import the mocked prisma
import { prisma } from "@/lib/db";

describe("WishlistService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

      (prisma.wishlist.findMany as any).mockResolvedValue(mockWishlists);

      const result = await WishlistService.getUserWishlists("user-1");

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

      (prisma.wishlist.findUnique as any).mockResolvedValue(mockWishlist);

      const result = await WishlistService.getWishlistByPermalink("public-wishlist", "user-2");

      expect(prisma.wishlist.findUnique).toHaveBeenCalledWith({
        where: { permalink: "public-wishlist" },
        include: {
          owner: {
            select: { id: true, name: true, email: true, image: true },
          },
          items: {
            where: { isDeleted: false },
            include: {
              claims: {
                where: { userId: { not: "user-2" } },
                select: { userId: true, createdAt: true },
              },
            },
            orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
          },
        },
      });

      expect(result).toEqual(mockWishlist);
    });

    it("should return null for private wishlist when not owner", async () => {
      const mockWishlist = {
        id: "wishlist-1",
        privacy: "PRIVATE",
        ownerId: "user-1",
      };

      (prisma.wishlist.findUnique as any).mockResolvedValue(mockWishlist);

      const result = await WishlistService.getWishlistByPermalink("private-wishlist", "user-2");

      expect(result).toBeNull();
    });

    it("should return private wishlist when user is owner", async () => {
      const mockWishlist = {
        id: "wishlist-1",
        privacy: "PRIVATE",
        ownerId: "user-1",
        owner: { id: "user-1", name: "John Doe", email: "john@example.com", image: null },
      };

      (prisma.wishlist.findUnique as any).mockResolvedValue(mockWishlist);

      const result = await WishlistService.getWishlistByPermalink("private-wishlist", "user-1");

      expect(result).toEqual(mockWishlist);
    });

    it("should return friends-only wishlist when users are friends", async () => {
      const mockWishlist = {
        id: "wishlist-1",
        privacy: "FRIENDS_ONLY",
        ownerId: "user-1",
        owner: { id: "user-1", name: "John Doe", email: "john@example.com", image: null },
      };

      const mockFriendship = {
        id: "friendship-1",
        userId: "user-1",
        friendId: "user-2",
        createdAt: new Date(),
      };

      (prisma.wishlist.findUnique as any).mockResolvedValue(mockWishlist);
      (prisma.friendship.findFirst as any).mockResolvedValue(mockFriendship);

      const result = await WishlistService.getWishlistByPermalink("friends-wishlist", "user-2");

      expect(prisma.friendship.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { userId: "user-1", friendId: "user-2" },
            { userId: "user-2", friendId: "user-1" },
          ],
        },
      });

      expect(result).toEqual(mockWishlist);
    });

    it("should return null for friends-only wishlist when users are not friends", async () => {
      const mockWishlist = {
        id: "wishlist-1",
        privacy: "FRIENDS_ONLY",
        ownerId: "user-1",
      };

      (prisma.wishlist.findUnique as any).mockResolvedValue(mockWishlist);
      (prisma.friendship.findFirst as any).mockResolvedValue(null);

      const result = await WishlistService.getWishlistByPermalink("friends-wishlist", "user-2");

      expect(result).toBeNull();
    });

    it("should return null when wishlist does not exist", async () => {
      (prisma.wishlist.findUnique as any).mockResolvedValue(null);

      const result = await WishlistService.getWishlistByPermalink("nonexistent", "user-1");

      expect(result).toBeNull();
    });

    it("should not include claims in items when no viewerId provided", async () => {
      const mockWishlist = {
        id: "wishlist-1",
        privacy: "PUBLIC",
        ownerId: "user-1",
        owner: { id: "user-1", name: "John Doe", email: "john@example.com", image: null },
      };

      (prisma.wishlist.findUnique as any).mockResolvedValue(mockWishlist);

      await WishlistService.getWishlistByPermalink("public-wishlist");

      expect(prisma.wishlist.findUnique).toHaveBeenCalledWith({
        where: { permalink: "public-wishlist" },
        include: {
          owner: {
            select: { id: true, name: true, email: true, image: true },
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

      (prisma.wishlist.findUnique as any).mockResolvedValue(null); // Permalink available
      (prisma.wishlist.create as any).mockResolvedValue(mockCreatedWishlist);

      const wishlistData: CreateWishlistData = {
        title: "My Test Wishlist!@#$%",
        description: "Test description",
        privacy: "FRIENDS_ONLY",
        isDefault: false,
      };

      const result = await WishlistService.createWishlist("user-1", wishlistData);

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

      (prisma.wishlist.findUnique as any)
        .mockResolvedValueOnce({ id: "existing-1" }) // "test" exists
        .mockResolvedValueOnce(null); // "test-1" available

      (prisma.wishlist.create as any).mockResolvedValue(mockCreatedWishlist);

      const wishlistData: CreateWishlistData = {
        title: "Test",
        privacy: "PUBLIC",
      };

      await WishlistService.createWishlist("user-1", wishlistData);

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

      (prisma.wishlist.findUnique as any).mockResolvedValue(null);
      (prisma.wishlist.updateMany as any).mockResolvedValue({ count: 1 });
      (prisma.wishlist.create as any).mockResolvedValue(mockCreatedWishlist);

      const wishlistData: CreateWishlistData = {
        title: "New Default",
        privacy: "PRIVATE",
        isDefault: true,
      };

      await WishlistService.createWishlist("user-1", wishlistData);

      expect(prisma.wishlist.updateMany).toHaveBeenCalledWith({
        where: { ownerId: "user-1", isDefault: true },
        data: { isDefault: false },
      });
    });

    it("should handle very long titles by truncating permalink", async () => {
      const longTitle = "A".repeat(100);
      const expectedPermalink = "a".repeat(50);

      (prisma.wishlist.findUnique as any).mockResolvedValue(null);
      (prisma.wishlist.create as any).mockResolvedValue({});

      const wishlistData: CreateWishlistData = {
        title: longTitle,
        privacy: "PUBLIC",
      };

      await WishlistService.createWishlist("user-1", wishlistData);

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

      (prisma.wishlist.findFirst as any).mockResolvedValue(mockWishlist);
      (prisma.wishlist.update as any).mockResolvedValue(mockUpdatedWishlist);

      const updateData: UpdateWishlistData = {
        title: "Updated Title",
        description: "Updated description",
        privacy: "PUBLIC",
      };

      const result = await WishlistService.updateWishlist("wishlist-1", "user-1", updateData);

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
      (prisma.wishlist.findFirst as any).mockResolvedValue(null);

      const updateData: UpdateWishlistData = {
        title: "Updated Title",
      };

      const result = await WishlistService.updateWishlist("wishlist-1", "user-2", updateData);

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

      (prisma.wishlist.findFirst as any).mockResolvedValue(mockWishlist);
      (prisma.wishlist.updateMany as any).mockResolvedValue({ count: 1 });
      (prisma.wishlist.update as any).mockResolvedValue(mockUpdatedWishlist);

      const updateData: UpdateWishlistData = {
        isDefault: true,
      };

      await WishlistService.updateWishlist("wishlist-1", "user-1", updateData);

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
      };

      (prisma.wishlist.findFirst as any).mockResolvedValue(mockWishlist);
      (prisma.wishlist.delete as any).mockResolvedValue(mockDeletedWishlist);

      const result = await WishlistService.deleteWishlist("wishlist-1", "user-1");

      expect(prisma.wishlist.findFirst).toHaveBeenCalledWith({
        where: { id: "wishlist-1", ownerId: "user-1" },
      });

      expect(prisma.wishlist.delete).toHaveBeenCalledWith({
        where: { id: "wishlist-1" },
      });

      expect(result).toEqual(mockDeletedWishlist);
    });

    it("should return null when user is not owner", async () => {
      (prisma.wishlist.findFirst as any).mockResolvedValue(null);

      const result = await WishlistService.deleteWishlist("wishlist-1", "user-2");

      expect(prisma.wishlist.delete).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should throw error when trying to delete the only wishlist", async () => {
      const mockWishlist = {
        id: "wishlist-1",
        ownerId: "user-1",
        isDefault: true,
      };

      (prisma.wishlist.findFirst as any).mockResolvedValue(mockWishlist);
      (prisma.wishlist.findMany as any).mockResolvedValue([]); // No other wishlists

      await expect(WishlistService.deleteWishlist("wishlist-1", "user-1")).rejects.toThrow(
        "Cannot delete the only wishlist"
      );
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

      (prisma.wishlist.findFirst as any).mockResolvedValue(mockWishlist);
      (prisma.wishlist.findMany as any).mockResolvedValue(otherWishlists);
      (prisma.wishlist.update as any).mockResolvedValue(otherWishlists[0]);
      (prisma.wishlist.delete as any).mockResolvedValue(mockWishlist);

      await WishlistService.deleteWishlist("wishlist-1", "user-1");

      expect(prisma.wishlist.findMany).toHaveBeenCalledWith({
        where: { ownerId: "user-1", id: { not: "wishlist-1" } },
      });

      expect(prisma.wishlist.update).toHaveBeenCalledWith({
        where: { id: "wishlist-2" },
        data: { isDefault: true },
      });

      expect(prisma.wishlist.delete).toHaveBeenCalledWith({
        where: { id: "wishlist-1" },
      });
    });
  });
});
