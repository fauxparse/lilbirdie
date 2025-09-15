import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileService } from "../ProfileService";

// Mock Prisma for unit tests
vi.mock("@/lib/db", () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Import the mocked prisma
import { prisma } from "@/lib/db";

describe("ProfileService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOrCreateProfile", () => {
    it("should return existing profile when found", async () => {
      const mockProfile = {
        id: "profile-1",
        userId: "user-1",
        birthday: null,
        preferredCurrency: "USD",
        theme: "dark",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      (prisma.profile.findUnique as any).mockResolvedValue(mockProfile);

      const result = await ProfileService.getInstance().getOrCreateProfile("user-1");

      expect(prisma.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });

      expect(prisma.profile.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockProfile);
    });

    it("should create new profile when not found", async () => {
      const mockCreatedProfile = {
        id: "profile-1",
        userId: "user-1",
        birthday: null,
        preferredCurrency: "USD",
        theme: "system",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      (prisma.profile.findUnique as any).mockResolvedValue(null);
      (prisma.profile.create as any).mockResolvedValue(mockCreatedProfile);

      const result = await ProfileService.getInstance().getOrCreateProfile("user-1");

      expect(prisma.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });

      expect(prisma.profile.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          theme: "system",
          preferredCurrency: "USD",
        },
      });

      expect(result).toEqual(mockCreatedProfile);
    });

    it("should handle multiple calls for same user efficiently", async () => {
      const mockProfile = {
        id: "profile-1",
        userId: "user-1",
        birthday: null,
        preferredCurrency: "USD",
        theme: "light",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      (prisma.profile.findUnique as any).mockResolvedValue(mockProfile);

      // Call multiple times
      await ProfileService.getInstance().getOrCreateProfile("user-1");
      await ProfileService.getInstance().getOrCreateProfile("user-1");

      expect(prisma.profile.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.profile.create).not.toHaveBeenCalled();
    });
  });

  describe("updateTheme", () => {
    it("should update theme for existing profile", async () => {
      const mockProfile = {
        id: "profile-1",
        userId: "user-1",
        birthday: null,
        preferredCurrency: "USD",
        theme: "system",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const mockUpdatedProfile = {
        ...mockProfile,
        theme: "dark",
        updatedAt: new Date("2024-01-02"),
      };

      (prisma.profile.findUnique as any).mockResolvedValue(mockProfile);
      (prisma.profile.update as any).mockResolvedValue(mockUpdatedProfile);

      const result = await ProfileService.getInstance().updateTheme("user-1", "dark");

      expect(prisma.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });

      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { id: "profile-1" },
        data: { theme: "dark" },
      });

      expect(result).toEqual(mockUpdatedProfile);
    });

    it("should create profile and update theme when profile doesn't exist", async () => {
      const mockCreatedProfile = {
        id: "profile-1",
        userId: "user-1",
        birthday: null,
        preferredCurrency: "USD",
        theme: "system",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const mockUpdatedProfile = {
        ...mockCreatedProfile,
        theme: "light",
        updatedAt: new Date("2024-01-02"),
      };

      (prisma.profile.findUnique as any).mockResolvedValue(null);
      (prisma.profile.create as any).mockResolvedValue(mockCreatedProfile);
      (prisma.profile.update as any).mockResolvedValue(mockUpdatedProfile);

      const result = await ProfileService.getInstance().updateTheme("user-1", "light");

      expect(prisma.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });

      expect(prisma.profile.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          theme: "system",
          preferredCurrency: "USD",
        },
      });

      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { id: "profile-1" },
        data: { theme: "light" },
      });

      expect(result).toEqual(mockUpdatedProfile);
    });

    it("should handle various theme values", async () => {
      const mockProfile = {
        id: "profile-1",
        userId: "user-1",
        theme: "system",
      };

      const themes = ["light", "dark", "system", "auto"];

      (prisma.profile.findUnique as any).mockResolvedValue(mockProfile);
      (prisma.profile.update as any).mockImplementation(({ data }: { data: any }) =>
        Promise.resolve({ ...mockProfile, theme: data.theme })
      );

      for (const theme of themes) {
        const result = await ProfileService.getInstance().updateTheme("user-1", theme);

        expect(prisma.profile.update).toHaveBeenCalledWith({
          where: { id: "profile-1" },
          data: { theme },
        });

        expect(result.theme).toBe(theme);
        vi.clearAllMocks();
        (prisma.profile.findUnique as any).mockResolvedValue(mockProfile);
      }
    });
  });

  describe("getProfile", () => {
    it("should return profile when found", async () => {
      const mockProfile = {
        id: "profile-1",
        userId: "user-1",
        birthday: new Date("1990-06-15"),
        preferredCurrency: "EUR",
        theme: "dark",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      (prisma.profile.findUnique as any).mockResolvedValue(mockProfile);

      const result = await ProfileService.getInstance().getProfile("user-1");

      expect(prisma.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });

      expect(result).toEqual(mockProfile);
    });

    it("should return null when profile not found", async () => {
      (prisma.profile.findUnique as any).mockResolvedValue(null);

      const result = await ProfileService.getInstance().getProfile("nonexistent-user");

      expect(prisma.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: "nonexistent-user" },
      });

      expect(result).toBeNull();
    });

    it("should handle profile with all possible field values", async () => {
      const mockProfile = {
        id: "profile-1",
        userId: "user-1",
        birthday: new Date("1985-12-25"),
        preferredCurrency: "GBP",
        theme: "light",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-06-15"),
      };

      (prisma.profile.findUnique as any).mockResolvedValue(mockProfile);

      const result = await ProfileService.getInstance().getProfile("user-1");

      expect(result).toEqual(mockProfile);
      expect(result?.birthday).toEqual(new Date("1985-12-25"));
      expect(result?.preferredCurrency).toBe("GBP");
      expect(result?.theme).toBe("light");
    });

    it("should handle profile with null birthday", async () => {
      const mockProfile = {
        id: "profile-1",
        userId: "user-1",
        birthday: null,
        preferredCurrency: "USD",
        theme: "system",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      (prisma.profile.findUnique as any).mockResolvedValue(mockProfile);

      const result = await ProfileService.getInstance().getProfile("user-1");

      expect(result?.birthday).toBeNull();
    });
  });

  describe("error handling", () => {
    it("should propagate database errors in getOrCreateProfile", async () => {
      const dbError = new Error("Database connection failed");
      (prisma.profile.findUnique as any).mockRejectedValue(dbError);

      await expect(ProfileService.getInstance().getOrCreateProfile("user-1")).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should propagate database errors in updateTheme", async () => {
      const mockProfile = {
        id: "profile-1",
        userId: "user-1",
        theme: "system",
      };

      const dbError = new Error("Update failed");
      (prisma.profile.findUnique as any).mockResolvedValue(mockProfile);
      (prisma.profile.update as any).mockRejectedValue(dbError);

      await expect(ProfileService.getInstance().updateTheme("user-1", "dark")).rejects.toThrow(
        "Update failed"
      );
    });

    it("should propagate database errors in getProfile", async () => {
      const dbError = new Error("Query failed");
      (prisma.profile.findUnique as any).mockRejectedValue(dbError);

      await expect(ProfileService.getInstance().getProfile("user-1")).rejects.toThrow(
        "Query failed"
      );
    });
  });

  describe("default values", () => {
    it("should create profile with correct default values", async () => {
      (prisma.profile.findUnique as any).mockResolvedValue(null);
      (prisma.profile.create as any).mockResolvedValue({});

      await ProfileService.getInstance().getOrCreateProfile("user-1");

      expect(prisma.profile.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          theme: "system",
          preferredCurrency: "USD",
        },
      });
    });

    it("should verify all default field values are set correctly", async () => {
      const expectedDefaults = {
        theme: "system",
        preferredCurrency: "USD",
      };

      (prisma.profile.findUnique as any).mockResolvedValue(null);
      (prisma.profile.create as any).mockResolvedValue({});

      await ProfileService.getInstance().getOrCreateProfile("user-1");

      expect(prisma.profile.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          ...expectedDefaults,
        },
      });
    });
  });
});
