import { beforeEach, describe, expect, it, type MockedFunction, vi } from "vitest";
import { prisma } from "@/lib/db";
import { PermissionService } from "../PermissionService";

// Mock the database
vi.mock("@/lib/db", () => ({
  prisma: {
    wishlist: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    wishlistEditor: {
      findFirst: vi.fn(),
    },
    friendship: {
      findFirst: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
    },
  },
}));

const mockPrisma = prisma as unknown as {
  wishlist: {
    findFirst: MockedFunction<any>;
    findUnique: MockedFunction<any>;
  };
  wishlistEditor: {
    findFirst: MockedFunction<any>;
  };
  friendship: {
    findFirst: MockedFunction<any>;
  };
  member: {
    findFirst: MockedFunction<any>;
  };
};

describe("PermissionService", () => {
  let permissionService: PermissionService;

  beforeEach(() => {
    vi.clearAllMocks();
    PermissionService.resetInstance();
    permissionService = PermissionService.getInstance();
  });

  describe("getInstance", () => {
    it("should return a singleton instance", () => {
      const instance1 = PermissionService.getInstance();
      const instance2 = PermissionService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("getUserWishlistRole", () => {
    it("should return 'owner' for wishlist owner", async () => {
      mockPrisma.wishlist.findFirst.mockResolvedValue({
        id: "wishlist-1",
        ownerId: "user-1",
      });

      const role = await permissionService.getUserWishlistRole("user-1", "wishlist-1");
      expect(role).toBe("owner");
    });

    it("should return 'collaborator' for wishlist editor", async () => {
      mockPrisma.wishlist.findFirst.mockResolvedValue(null);
      mockPrisma.wishlistEditor.findFirst.mockResolvedValue({
        wishlistId: "wishlist-1",
        userId: "user-1",
        canDelete: false,
      });

      const role = await permissionService.getUserWishlistRole("user-1", "wishlist-1");
      expect(role).toBe("collaborator");
    });

    it("should return 'friend' for friend of owner with friends-only wishlist", async () => {
      mockPrisma.wishlist.findFirst.mockResolvedValue(null);
      mockPrisma.wishlistEditor.findFirst.mockResolvedValue(null);
      mockPrisma.wishlist.findUnique.mockResolvedValue({
        ownerId: "owner-1",
        privacy: "FRIENDS_ONLY",
      });
      mockPrisma.friendship.findFirst.mockResolvedValue({
        userId: "owner-1",
        friendId: "user-1",
      });

      const role = await permissionService.getUserWishlistRole("user-1", "wishlist-1");
      expect(role).toBe("friend");
    });

    it("should return 'viewer' for public wishlist", async () => {
      mockPrisma.wishlist.findFirst.mockResolvedValue(null);
      mockPrisma.wishlistEditor.findFirst.mockResolvedValue(null);
      mockPrisma.wishlist.findUnique.mockResolvedValue({
        ownerId: "owner-1",
        privacy: "PUBLIC",
      });

      const role = await permissionService.getUserWishlistRole("user-1", "wishlist-1");
      expect(role).toBe("viewer");
    });

    it("should return null for private wishlist with no access", async () => {
      mockPrisma.wishlist.findFirst.mockResolvedValue(null);
      mockPrisma.wishlistEditor.findFirst.mockResolvedValue(null);
      mockPrisma.wishlist.findUnique.mockResolvedValue({
        ownerId: "owner-1",
        privacy: "PRIVATE",
      });

      const role = await permissionService.getUserWishlistRole("user-1", "wishlist-1");
      expect(role).toBe(null);
    });

    it("should return null for non-existent wishlist", async () => {
      mockPrisma.wishlist.findFirst.mockResolvedValue(null);
      mockPrisma.wishlistEditor.findFirst.mockResolvedValue(null);
      mockPrisma.wishlist.findUnique.mockResolvedValue(null);

      const role = await permissionService.getUserWishlistRole("user-1", "wishlist-1");
      expect(role).toBe(null);
    });
  });

  describe("hasPermission", () => {
    it("should grant owner full permissions", async () => {
      mockPrisma.wishlist.findFirst.mockResolvedValue({
        id: "wishlist-1",
        ownerId: "user-1",
      });

      const hasRead = await permissionService.hasPermission(
        { userId: "user-1", wishlistId: "wishlist-1" },
        "wishlists:read"
      );
      const hasWrite = await permissionService.hasPermission(
        { userId: "user-1", wishlistId: "wishlist-1" },
        "wishlists:write"
      );
      const hasDelete = await permissionService.hasPermission(
        { userId: "user-1", wishlistId: "wishlist-1" },
        "wishlists:delete"
      );

      expect(hasRead).toBe(true);
      expect(hasWrite).toBe(true);
      expect(hasDelete).toBe(true);
    });

    it("should grant collaborator limited permissions", async () => {
      mockPrisma.wishlist.findFirst.mockResolvedValue(null);
      mockPrisma.wishlistEditor.findFirst.mockResolvedValue({
        wishlistId: "wishlist-1",
        userId: "user-1",
        canDelete: false,
      });

      const hasRead = await permissionService.hasPermission(
        { userId: "user-1", wishlistId: "wishlist-1" },
        "wishlists:read"
      );
      const hasWrite = await permissionService.hasPermission(
        { userId: "user-1", wishlistId: "wishlist-1" },
        "wishlists:write"
      );
      const hasDelete = await permissionService.hasPermission(
        { userId: "user-1", wishlistId: "wishlist-1" },
        "wishlists:delete"
      );

      expect(hasRead).toBe(true);
      expect(hasWrite).toBe(true);
      expect(hasDelete).toBe(false);
    });

    it("should grant friend read and claim permissions only", async () => {
      mockPrisma.wishlist.findFirst.mockResolvedValue(null);
      mockPrisma.wishlistEditor.findFirst.mockResolvedValue(null);
      mockPrisma.wishlist.findUnique.mockResolvedValue({
        ownerId: "owner-1",
        privacy: "FRIENDS_ONLY",
      });
      mockPrisma.friendship.findFirst.mockResolvedValue({
        userId: "owner-1",
        friendId: "user-1",
      });

      const hasRead = await permissionService.hasPermission(
        { userId: "user-1", wishlistId: "wishlist-1" },
        "wishlists:read"
      );
      const hasWrite = await permissionService.hasPermission(
        { userId: "user-1", wishlistId: "wishlist-1" },
        "wishlists:write"
      );
      const canClaim = await permissionService.hasPermission(
        { userId: "user-1", wishlistId: "wishlist-1" },
        "items:claim"
      );

      expect(hasRead).toBe(true);
      expect(hasWrite).toBe(false);
      expect(canClaim).toBe(true);
    });

    it("should grant viewer read and claim permissions for public wishlist", async () => {
      mockPrisma.wishlist.findFirst.mockResolvedValue(null);
      mockPrisma.wishlistEditor.findFirst.mockResolvedValue(null);
      mockPrisma.wishlist.findUnique.mockResolvedValue({
        ownerId: "owner-1",
        privacy: "PUBLIC",
      });

      const hasRead = await permissionService.hasPermission(
        { userId: "user-1", wishlistId: "wishlist-1" },
        "wishlists:read"
      );
      const hasWrite = await permissionService.hasPermission(
        { userId: "user-1", wishlistId: "wishlist-1" },
        "wishlists:write"
      );
      const canClaim = await permissionService.hasPermission(
        { userId: "user-1", wishlistId: "wishlist-1" },
        "items:claim"
      );

      expect(hasRead).toBe(true);
      expect(hasWrite).toBe(false);
      expect(canClaim).toBe(true);
    });

    it("should deny access for users with no role", async () => {
      mockPrisma.wishlist.findFirst.mockResolvedValue(null);
      mockPrisma.wishlistEditor.findFirst.mockResolvedValue(null);
      mockPrisma.wishlist.findUnique.mockResolvedValue({
        ownerId: "owner-1",
        privacy: "PRIVATE",
      });

      const hasRead = await permissionService.hasPermission(
        { userId: "user-1", wishlistId: "wishlist-1" },
        "wishlists:read"
      );

      expect(hasRead).toBe(false);
    });

    it("should allow global permissions for authenticated users", async () => {
      const canInviteFriends = await permissionService.hasPermission(
        { userId: "user-1" },
        "friends:invite"
      );
      const canManageFriends = await permissionService.hasPermission(
        { userId: "user-1" },
        "friends:manage"
      );

      expect(canInviteFriends).toBe(true);
      expect(canManageFriends).toBe(true);
    });

    it("should handle errors gracefully", async () => {
      mockPrisma.wishlist.findFirst.mockRejectedValue(new Error("Database error"));

      const hasPermission = await permissionService.hasPermission(
        { userId: "user-1", wishlistId: "wishlist-1" },
        "wishlists:read"
      );

      expect(hasPermission).toBe(false);
    });
  });

  describe("requirePermission", () => {
    it("should not throw for valid permissions", async () => {
      mockPrisma.wishlist.findFirst.mockResolvedValue({
        id: "wishlist-1",
        ownerId: "user-1",
      });

      await expect(
        permissionService.requirePermission(
          { userId: "user-1", wishlistId: "wishlist-1" },
          "wishlists:read"
        )
      ).resolves.not.toThrow();
    });

    it("should throw for invalid permissions", async () => {
      mockPrisma.wishlist.findFirst.mockResolvedValue(null);
      mockPrisma.wishlistEditor.findFirst.mockResolvedValue(null);
      mockPrisma.wishlist.findUnique.mockResolvedValue({
        ownerId: "owner-1",
        privacy: "PRIVATE",
      });

      await expect(
        permissionService.requirePermission(
          { userId: "user-1", wishlistId: "wishlist-1" },
          "wishlists:read"
        )
      ).rejects.toThrow("Access denied: missing permission 'wishlists:read'");
    });
  });

  describe("getUserPermissions", () => {
    it("should return all permissions for owner", async () => {
      mockPrisma.wishlist.findFirst.mockResolvedValue({
        id: "wishlist-1",
        ownerId: "user-1",
      });

      const permissions = await permissionService.getUserPermissions({
        userId: "user-1",
        wishlistId: "wishlist-1",
      });

      expect(permissions).toContain("wishlists:read");
      expect(permissions).toContain("wishlists:write");
      expect(permissions).toContain("wishlists:delete");
      expect(permissions).toContain("items:read");
      expect(permissions).toContain("items:write");
      expect(permissions).toContain("items:delete");
      expect(permissions).toContain("friends:invite");
      expect(permissions).toContain("friends:manage");
    });

    it("should return limited permissions for collaborator", async () => {
      mockPrisma.wishlist.findFirst.mockResolvedValue(null);
      mockPrisma.wishlistEditor.findFirst.mockResolvedValue({
        wishlistId: "wishlist-1",
        userId: "user-1",
        canDelete: false,
      });

      const permissions = await permissionService.getUserPermissions({
        userId: "user-1",
        wishlistId: "wishlist-1",
      });

      expect(permissions).toContain("wishlists:read");
      expect(permissions).toContain("wishlists:write");
      expect(permissions).toContain("items:read");
      expect(permissions).toContain("items:write");
      expect(permissions).not.toContain("wishlists:delete");
      expect(permissions).not.toContain("items:delete");
    });

    it("should return read and claim permissions for viewer on public wishlist", async () => {
      mockPrisma.wishlist.findFirst.mockResolvedValue(null);
      mockPrisma.wishlistEditor.findFirst.mockResolvedValue(null);
      mockPrisma.wishlist.findUnique.mockResolvedValue({
        ownerId: "owner-1",
        privacy: "PUBLIC",
      });

      const permissions = await permissionService.getUserPermissions({
        userId: "user-1",
        wishlistId: "wishlist-1",
      });

      expect(permissions).toContain("wishlists:read");
      expect(permissions).toContain("items:read");
      expect(permissions).toContain("items:claim");
      expect(permissions).not.toContain("wishlists:write");
      expect(permissions).not.toContain("items:write");
      expect(permissions).not.toContain("wishlists:delete");
    });

    it("should return only global permissions when no context", async () => {
      const permissions = await permissionService.getUserPermissions({ userId: "user-1" });

      expect(permissions).toContain("friends:invite");
      expect(permissions).toContain("friends:manage");
      expect(permissions).not.toContain("wishlists:read");
    });
  });
});
