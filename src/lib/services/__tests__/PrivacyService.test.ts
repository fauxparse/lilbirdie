import { beforeEach, describe, expect, it, vi } from "vitest";
import { PrivacyService, type UserData } from "../PrivacyService";

// Mock Prisma for unit tests
vi.mock("@/lib/db", () => ({
  prisma: {
    friendship: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Import the mocked prisma
import { prisma } from "@/lib/db";

describe("PrivacyService", () => {
  let privacyService: PrivacyService;

  beforeEach(() => {
    vi.clearAllMocks();
    privacyService = PrivacyService.getInstance();
  });

  describe("getInstance", () => {
    it("should return the same instance (singleton)", () => {
      const instance1 = PrivacyService.getInstance();
      const instance2 = PrivacyService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("areFriends", () => {
    it("should return true for same user ID", async () => {
      const result = await privacyService.areFriends("user-1", "user-1");
      expect(result).toBe(true);
      expect(prisma.friendship.findFirst).not.toHaveBeenCalled();
    });

    it("should return true when friendship exists (userId -> friendId)", async () => {
      (prisma.friendship.findFirst as any).mockResolvedValue({
        id: "friendship-1",
        userId: "user-1",
        friendId: "user-2",
      });

      const result = await privacyService.areFriends("user-1", "user-2");
      expect(result).toBe(true);
      expect(prisma.friendship.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { userId: "user-1", friendId: "user-2" },
            { userId: "user-2", friendId: "user-1" },
          ],
        },
      });
    });

    it("should return true when friendship exists (friendId -> userId)", async () => {
      (prisma.friendship.findFirst as any).mockResolvedValue({
        id: "friendship-1",
        userId: "user-2",
        friendId: "user-1",
      });

      const result = await privacyService.areFriends("user-1", "user-2");
      expect(result).toBe(true);
    });

    it("should return false when no friendship exists", async () => {
      (prisma.friendship.findFirst as any).mockResolvedValue(null);

      const result = await privacyService.areFriends("user-1", "user-2");
      expect(result).toBe(false);
    });
  });

  describe("checkFriendships", () => {
    it("should return empty map for empty user IDs", async () => {
      const result = await privacyService.checkFriendships("user-1", []);
      expect(result.size).toBe(0);
      expect(prisma.friendship.findMany).not.toHaveBeenCalled();
    });

    it("should mark viewer as friend with themselves", async () => {
      const result = await privacyService.checkFriendships("user-1", ["user-1"]);
      expect(result.get("user-1")).toBe(true);
      expect(prisma.friendship.findMany).not.toHaveBeenCalled();
    });

    it("should check friendships for multiple users", async () => {
      (prisma.friendship.findMany as any).mockResolvedValue([
        { userId: "user-1", friendId: "user-2" },
        { userId: "user-3", friendId: "user-1" },
      ]);

      const result = await privacyService.checkFriendships("user-1", [
        "user-2",
        "user-3",
        "user-4",
      ]);

      expect(result.get("user-2")).toBe(true); // friend via user-1 -> user-2
      expect(result.get("user-3")).toBe(true); // friend via user-3 -> user-1
      expect(result.get("user-4")).toBe(false); // not a friend

      expect(prisma.friendship.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { userId: "user-1", friendId: { in: ["user-2", "user-3", "user-4"] } },
            { userId: { in: ["user-2", "user-3", "user-4"] }, friendId: "user-1" },
          ],
        },
        select: {
          userId: true,
          friendId: true,
        },
      });
    });

    it("should handle mix of self and other users", async () => {
      (prisma.friendship.findMany as any).mockResolvedValue([
        { userId: "user-1", friendId: "user-2" },
      ]);

      const result = await privacyService.checkFriendships("user-1", [
        "user-1",
        "user-2",
        "user-3",
      ]);

      expect(result.get("user-1")).toBe(true); // self
      expect(result.get("user-2")).toBe(true); // friend
      expect(result.get("user-3")).toBe(false); // not friend
    });
  });

  describe("redactUserData", () => {
    const userData: UserData = {
      id: "user-1",
      name: "John Doe",
      image: "https://example.com/avatar.jpg",
    };

    it("should return full user data for friends", () => {
      const result = privacyService.redactUserData(userData, true);
      expect(result).toEqual(userData);
    });

    it("should return null for non-friends", () => {
      const result = privacyService.redactUserData(userData, false);
      expect(result).toBeNull();
    });
  });

  describe("redactMultipleUsers", () => {
    const usersData: UserData[] = [
      {
        id: "user-1",
        name: "John Doe",
        image: "https://example.com/avatar1.jpg",
      },
      {
        id: "user-2",
        name: "Jane Smith",
        image: "https://example.com/avatar2.jpg",
      },
    ];

    it("should redact based on friendship map", () => {
      const friendshipMap = new Map([
        ["user-1", true],
        ["user-2", false],
      ]);

      const result = privacyService.redactMultipleUsers(usersData, friendshipMap);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(usersData[0]); // friend - full data
      expect(result[1]).toBeNull(); // non-friend - null
    });

    it("should handle missing friendship data as non-friend", () => {
      const friendshipMap = new Map([
        ["user-1", true],
        // user-2 missing from map
      ]);

      const result = privacyService.redactMultipleUsers(usersData, friendshipMap);

      expect(result[0]).toEqual(usersData[0]); // friend
      expect(result[1]).toBeNull(); // missing = non-friend
    });
  });

  describe("redactClaimsUserData", () => {
    const mockClaims = [
      {
        id: "claim-1",
        userId: "user-1",
        itemId: "item-1",
        wishlistId: "wishlist-1",
        createdAt: "2024-01-01T00:00:00Z",
        user: {
          id: "user-1",
          name: "John Doe",
          image: "https://example.com/avatar1.jpg",
        },
      },
      {
        id: "claim-2",
        userId: "user-2",
        itemId: "item-1",
        wishlistId: "wishlist-1",
        createdAt: "2024-01-02T00:00:00Z",
        user: {
          id: "user-2",
          name: "Jane Smith",
          image: "https://example.com/avatar2.jpg",
        },
      },
    ];

    it("should return empty array for empty claims", async () => {
      const result = await privacyService.redactClaimsUserData([], "viewer-1");
      expect(result).toEqual([]);
      expect(prisma.friendship.findMany).not.toHaveBeenCalled();
    });

    it("should redact claims based on friendship status", async () => {
      (prisma.friendship.findMany as any).mockResolvedValue([
        { userId: "viewer-1", friendId: "user-1" }, // user-1 is friend
        // user-2 is not friend
      ]);

      const result = await privacyService.redactClaimsUserData(mockClaims, "viewer-1");

      expect(result).toHaveLength(2);

      // First claim - user is friend, should have full user data
      expect(result[0]).toEqual({
        ...mockClaims[0],
        user: mockClaims[0].user,
      });

      // Second claim - user is not friend, should have null user
      expect(result[1]).toEqual({
        ...mockClaims[1],
        user: null,
      });
    });

    it("should handle viewer being the claimer", async () => {
      const claimsWithViewer = [
        {
          ...mockClaims[0],
          userId: "viewer-1",
          user: { ...mockClaims[0].user, id: "viewer-1" },
        },
        mockClaims[1],
      ];

      (prisma.friendship.findMany as any).mockResolvedValue([]);

      const result = await privacyService.redactClaimsUserData(claimsWithViewer, "viewer-1");

      // Viewer should see their own data
      expect(result[0].user).toEqual(claimsWithViewer[0].user);
      // Non-friend should be null
      expect(result[1].user).toBeNull();
    });
  });
});
