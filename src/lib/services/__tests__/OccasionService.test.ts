import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateOccasionData, UpdateOccasionData } from "../OccasionService";
import { OccasionService } from "../OccasionService";

// Mock Prisma for unit tests
vi.mock("@/lib/db", () => ({
  prisma: {
    occasion: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Import the mocked prisma
import { prisma } from "@/lib/db";

describe("OccasionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createOccasion", () => {
    it("should create an occasion with required fields", async () => {
      const mockOccasion = {
        id: "test-id",
        title: "Test Birthday",
        date: new Date("2024-06-15"),
        type: "BIRTHDAY",
        isRecurring: true,
        startYear: 2015,
        ownerId: "user-1",
        entityType: null,
        entityId: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: {
          id: "user-1",
          name: "Test User",
          image: null,
        },
      };

      (prisma.occasion.create as any).mockResolvedValue(mockOccasion);

      const occasionData: CreateOccasionData = {
        title: "Test Birthday",
        date: new Date("2024-06-15"),
        type: "BIRTHDAY",
        isRecurring: true,
        startYear: 2015,
      };

      const result = await OccasionService.getInstance().createOccasion("user-1", occasionData);

      expect(prisma.occasion.create).toHaveBeenCalledWith({
        data: {
          title: "Test Birthday",
          date: new Date("2024-06-15"),
          type: "BIRTHDAY",
          isRecurring: true,
          startYear: 2015,
          ownerId: "user-1",
          entityType: undefined,
          entityId: undefined,
          description: undefined,
        },
        include: {
          owner: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      expect(result).toEqual(mockOccasion);
    });

    it("should create an occasion with entity relationship", async () => {
      const mockOccasion = {
        id: "test-id",
        title: "Child's Birthday",
        date: new Date("2015-06-15"),
        type: "BIRTHDAY",
        isRecurring: true,
        startYear: 2015,
        ownerId: "user-1",
        entityType: "WISHLIST",
        entityId: "wishlist-1",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: {
          id: "user-1",
          name: "Test User",
          image: null,
        },
      };

      (prisma.occasion.create as any).mockResolvedValue(mockOccasion);

      const occasionData: CreateOccasionData = {
        title: "Child's Birthday",
        date: new Date("2015-06-15"),
        type: "BIRTHDAY",
        isRecurring: true,
        startYear: 2015,
        entityType: "WISHLIST",
        entityId: "wishlist-1",
      };

      await OccasionService.getInstance().createOccasion("user-1", occasionData);

      expect(prisma.occasion.create).toHaveBeenCalledWith({
        data: {
          title: "Child's Birthday",
          date: new Date("2015-06-15"),
          type: "BIRTHDAY",
          isRecurring: true,
          startYear: 2015,
          ownerId: "user-1",
          entityType: "WISHLIST",
          entityId: "wishlist-1",
          description: undefined,
        },
        include: {
          owner: {
            select: { id: true, name: true, image: true },
          },
        },
      });
    });
  });

  describe("getUserOccasions", () => {
    it("should fetch user occasions sorted by date", async () => {
      const mockOccasions = [
        {
          id: "occ-1",
          title: "Birthday",
          date: new Date("2024-06-15"),
          type: "BIRTHDAY",
          isRecurring: true,
          startYear: 2015,
          ownerId: "user-1",
          entityType: null,
          entityId: null,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: { id: "user-1", name: "Test User", email: "test@example.com", image: null },
        },
      ];

      (prisma.occasion.findMany as any).mockResolvedValue(mockOccasions);

      const result = await OccasionService.getInstance().getUserOccasions("user-1");

      expect(prisma.occasion.findMany).toHaveBeenCalledWith({
        where: { ownerId: "user-1" },
        include: {
          owner: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { date: "asc" },
      });

      expect(result).toEqual(mockOccasions);
    });
  });

  describe("getOccasionById", () => {
    it("should return occasion if user is owner", async () => {
      const mockOccasion = {
        id: "occ-1",
        title: "Birthday",
        date: new Date("2024-06-15"),
        type: "BIRTHDAY",
        isRecurring: true,
        startYear: 2015,
        ownerId: "user-1",
        entityType: null,
        entityId: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: "user-1", name: "Test User", email: "test@example.com", image: null },
      };

      (prisma.occasion.findUnique as any).mockResolvedValue(mockOccasion);

      const result = await OccasionService.getInstance().getOccasionById("occ-1", "user-1");

      expect(prisma.occasion.findUnique).toHaveBeenCalledWith({
        where: { id: "occ-1" },
        include: {
          owner: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      expect(result).toEqual(mockOccasion);
    });

    it("should return null if user is not owner", async () => {
      const mockOccasion = {
        id: "occ-1",
        ownerId: "user-2", // Different user
        owner: { id: "user-2", name: "Other User", email: "other@example.com", image: null },
      };

      (prisma.occasion.findUnique as any).mockResolvedValue(mockOccasion);

      const result = await OccasionService.getInstance().getOccasionById("occ-1", "user-1");

      expect(result).toBeNull();
    });

    it("should return null if occasion not found", async () => {
      (prisma.occasion.findUnique as any).mockResolvedValue(null);

      const result = await OccasionService.getInstance().getOccasionById("nonexistent", "user-1");

      expect(result).toBeNull();
    });
  });

  describe("updateOccasion", () => {
    it("should update occasion if user is owner", async () => {
      const mockOccasion = {
        id: "occ-1",
        ownerId: "user-1",
        owner: { id: "user-1", name: "Test User", email: "test@example.com", image: null },
      };

      const updatedOccasion = {
        ...mockOccasion,
        title: "Updated Birthday",
        date: new Date("2024-07-15"),
      };

      (prisma.occasion.findUnique as any).mockResolvedValue(mockOccasion);
      (prisma.occasion.update as any).mockResolvedValue(updatedOccasion);

      const updateData: UpdateOccasionData = {
        title: "Updated Birthday",
        date: new Date("2024-07-15"),
      };

      const result = await OccasionService.getInstance().updateOccasion(
        "occ-1",
        "user-1",
        updateData
      );

      expect(prisma.occasion.update).toHaveBeenCalledWith({
        where: { id: "occ-1" },
        data: updateData,
        include: {
          owner: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      expect(result).toEqual(updatedOccasion);
    });

    it("should return null if user is not owner", async () => {
      const mockOccasion = {
        id: "occ-1",
        ownerId: "user-2", // Different user
      };

      (prisma.occasion.findUnique as any).mockResolvedValue(mockOccasion);

      const result = await OccasionService.getInstance().updateOccasion("occ-1", "user-1", {
        title: "Updated",
      });

      expect(prisma.occasion.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe("deleteOccasion", () => {
    it("should delete occasion if user is owner", async () => {
      const mockOccasion = {
        id: "occ-1",
        ownerId: "user-1",
        owner: { id: "user-1", name: "Test User", email: "test@example.com", image: null },
      };

      (prisma.occasion.findUnique as any).mockResolvedValue(mockOccasion);
      (prisma.occasion.delete as any).mockResolvedValue({});

      const result = await OccasionService.getInstance().deleteOccasion("occ-1", "user-1");

      expect(prisma.occasion.delete).toHaveBeenCalledWith({
        where: { id: "occ-1" },
      });

      expect(result).toBe(true);
    });

    it("should return false if user is not owner", async () => {
      const mockOccasion = {
        id: "occ-1",
        ownerId: "user-2", // Different user
      };

      (prisma.occasion.findUnique as any).mockResolvedValue(mockOccasion);

      const result = await OccasionService.getInstance().deleteOccasion("occ-1", "user-1");

      expect(prisma.occasion.delete).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe("getUpcomingOccasions", () => {
    it("should return occasions with calculated next occurrences", async () => {
      const now = new Date("2024-01-01T00:00:00Z");
      vi.setSystemTime(now);

      const mockOccasions = [
        {
          id: "occ-1",
          title: "Birthday",
          date: new Date("2023-06-15T00:00:00Z"), // Past birthday
          type: "BIRTHDAY",
          isRecurring: true,
          startYear: 2015,
          ownerId: "user-1",
          entityType: null,
          entityId: null,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: { id: "user-1", name: "Test User", email: "test@example.com", image: null },
        },
        {
          id: "occ-2",
          title: "Christmas",
          date: new Date("2023-12-25T00:00:00Z"), // Past Christmas
          type: "CHRISTMAS",
          isRecurring: true,
          startYear: null,
          ownerId: "user-1",
          entityType: null,
          entityId: null,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: { id: "user-1", name: "Test User", email: "test@example.com", image: null },
        },
      ];

      (prisma.occasion.findMany as any).mockResolvedValue(mockOccasions);

      const result = await OccasionService.getInstance().getUpcomingOccasions("user-1", 12);

      expect(result).toHaveLength(2);
      expect(result[0].nextOccurrence?.toDateString()).toEqual(
        new Date("2024-06-15").toDateString()
      ); // Next birthday
      expect(result[1].nextOccurrence?.toDateString()).toEqual(
        new Date("2024-12-25").toDateString()
      ); // Next Christmas

      vi.useRealTimers();
    });

    it("should filter out non-recurring past events", async () => {
      const now = new Date("2024-01-01T00:00:00Z");
      vi.setSystemTime(now);

      const mockOccasions = [
        {
          id: "occ-1",
          title: "One-time Event",
          date: new Date("2023-06-15"), // Past one-time event
          type: "CUSTOM",
          isRecurring: false,
          startYear: null,
          ownerId: "user-1",
          owner: { id: "user-1", name: "Test User", email: "test@example.com", image: null },
        },
      ];

      (prisma.occasion.findMany as any).mockResolvedValue(mockOccasions);

      const result = await OccasionService.getInstance().getUpcomingOccasions("user-1", 12);

      expect(result).toHaveLength(0); // Past non-recurring event should be filtered out

      vi.useRealTimers();
    });
  });

  describe("calculateNextOccurrence", () => {
    it("should return the original date for future non-recurring events", () => {
      const futureDate = new Date("2025-06-15");
      const fromDate = new Date("2024-01-01");

      const result = OccasionService.getInstance().calculateNextOccurrence(
        futureDate,
        false,
        fromDate
      );

      expect(result).toEqual(futureDate);
    });

    it("should return null for past non-recurring events", () => {
      const pastDate = new Date("2023-06-15");
      const fromDate = new Date("2024-01-01");

      const result = OccasionService.getInstance().calculateNextOccurrence(
        pastDate,
        false,
        fromDate
      );

      expect(result).toBeNull();
    });

    it("should calculate next occurrence for recurring events in current year", () => {
      const originalDate = new Date("2023-06-15T00:00:00Z");
      const fromDate = new Date("2024-01-01T00:00:00Z");

      const result = OccasionService.getInstance().calculateNextOccurrence(
        originalDate,
        true,
        fromDate
      );

      expect(result?.toDateString()).toEqual(new Date("2024-06-15").toDateString());
    });

    it("should calculate next occurrence for recurring events in next year", () => {
      const originalDate = new Date("2023-06-15T00:00:00Z");
      const fromDate = new Date("2024-07-01T00:00:00Z"); // After June 15th

      const result = OccasionService.getInstance().calculateNextOccurrence(
        originalDate,
        true,
        fromDate
      );

      expect(result?.toDateString()).toEqual(new Date("2025-06-15").toDateString());
    });
  });

  describe("calculateAge", () => {
    it("should calculate age correctly", () => {
      const birthDate = new Date("2015-06-15");
      const startYear = 2015;
      const asOf = new Date("2024-07-01"); // After birthday

      const age = OccasionService.getInstance().calculateAge(birthDate, startYear, asOf);

      expect(age).toBe(9);
    });

    it("should calculate age correctly when birthday hasn't occurred yet", () => {
      const birthDate = new Date("2015-06-15");
      const startYear = 2015;
      const asOf = new Date("2024-05-01"); // Before birthday

      const age = OccasionService.getInstance().calculateAge(birthDate, startYear, asOf);

      expect(age).toBe(8);
    });

    it("should return null when no start year provided", () => {
      const birthDate = new Date("2015-06-15");
      const asOf = new Date("2024-07-01");

      const age = OccasionService.getInstance().calculateAge(birthDate, undefined, asOf);

      expect(age).toBeNull();
    });
  });

  describe("createBirthdayOccasion", () => {
    it("should create a birthday occasion with correct parameters", async () => {
      const mockOccasion = {
        id: "test-id",
        title: "Emma's Birthday",
        date: new Date("2015-06-15"),
        type: "BIRTHDAY",
        isRecurring: true,
        startYear: 2015,
        ownerId: "user-1",
        entityType: "WISHLIST",
        entityId: "wishlist-1",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: "user-1", name: "Test User", email: "test@example.com", image: null },
      };

      (prisma.occasion.create as any).mockResolvedValue(mockOccasion);

      await OccasionService.getInstance().createBirthdayOccasion(
        "user-1",
        "Emma's Birthday",
        new Date("2015-06-15"),
        2015,
        "WISHLIST",
        "wishlist-1"
      );

      expect(prisma.occasion.create).toHaveBeenCalledWith({
        data: {
          title: "Emma's Birthday",
          date: new Date("2015-06-15"),
          type: "BIRTHDAY",
          isRecurring: true,
          startYear: 2015,
          ownerId: "user-1",
          entityType: "WISHLIST",
          entityId: "wishlist-1",
        },
        include: {
          owner: {
            select: { id: true, name: true, image: true },
          },
        },
      });
    });
  });

  describe("createAnniversaryOccasion", () => {
    it("should create an anniversary occasion with correct parameters", async () => {
      const mockOccasion = {
        id: "test-id",
        title: "Wedding Anniversary",
        date: new Date("2020-03-14"),
        type: "ANNIVERSARY",
        isRecurring: true,
        startYear: null,
        ownerId: "user-1",
        entityType: "FRIENDSHIP",
        entityId: "friendship-1",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: "user-1", name: "Test User", email: "test@example.com", image: null },
      };

      (prisma.occasion.create as any).mockResolvedValue(mockOccasion);

      await OccasionService.getInstance().createAnniversaryOccasion(
        "user-1",
        "Wedding Anniversary",
        new Date("2020-03-14"),
        "FRIENDSHIP",
        "friendship-1"
      );

      expect(prisma.occasion.create).toHaveBeenCalledWith({
        data: {
          title: "Wedding Anniversary",
          date: new Date("2020-03-14"),
          type: "ANNIVERSARY",
          isRecurring: true,
          ownerId: "user-1",
          entityType: "FRIENDSHIP",
          entityId: "friendship-1",
        },
        include: {
          owner: {
            select: { id: true, name: true, image: true },
          },
        },
      });
    });
  });

  describe("createGlobalOccasion", () => {
    it("should create Christmas occasion", async () => {
      const currentYear = new Date().getFullYear();
      const mockOccasion = {
        id: "test-id",
        title: "Christmas",
        date: new Date(currentYear, 11, 25), // Dec 25 of current year
        type: "CHRISTMAS",
        isRecurring: true,
        startYear: null,
        ownerId: "user-1",
        entityType: null,
        entityId: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: "user-1", name: "Test User", email: "test@example.com", image: null },
      };

      (prisma.occasion.create as any).mockResolvedValue(mockOccasion);

      await OccasionService.getInstance().createGlobalOccasion("user-1", "CHRISTMAS");

      expect(prisma.occasion.create).toHaveBeenCalledWith({
        data: {
          title: "Christmas",
          date: new Date(currentYear, 11, 25),
          type: "CHRISTMAS",
          isRecurring: true,
          ownerId: "user-1",
        },
        include: {
          owner: {
            select: { id: true, name: true, image: true },
          },
        },
      });
    });

    it("should create Valentine's Day occasion", async () => {
      const currentYear = new Date().getFullYear();
      const mockOccasion = {
        id: "test-id",
        title: "Valentine's Day",
        date: new Date(currentYear, 1, 14), // Feb 14 of current year
        type: "VALENTINES_DAY",
        isRecurring: true,
        startYear: null,
        ownerId: "user-1",
        entityType: null,
        entityId: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: "user-1", name: "Test User", email: "test@example.com", image: null },
      };

      (prisma.occasion.create as any).mockResolvedValue(mockOccasion);

      await OccasionService.getInstance().createGlobalOccasion("user-1", "VALENTINES_DAY");

      expect(prisma.occasion.create).toHaveBeenCalledWith({
        data: {
          title: "Valentine's Day",
          date: new Date(currentYear, 1, 14),
          type: "VALENTINES_DAY",
          isRecurring: true,
          ownerId: "user-1",
        },
        include: {
          owner: {
            select: { id: true, name: true, image: true },
          },
        },
      });
    });
  });
});
