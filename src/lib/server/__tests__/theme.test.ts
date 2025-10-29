import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerTheme, resolveTheme } from "@/lib/server/theme";
import { ProfileService } from "@/lib/services/ProfileService";

// Mock the ProfileService
vi.mock("@/lib/services/ProfileService");
vi.mock("@/lib/server/auth", () => ({
  getServerSession: vi.fn(),
}));

const mockProfileService = vi.mocked(ProfileService);

describe("getServerTheme", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 'system' when no session", async () => {
    const { getServerSession } = await import("@/lib/server/auth");
    vi.mocked(getServerSession).mockResolvedValue(null);

    const result = await getServerTheme();
    expect(result).toBe("system");
  });

  it("should return 'system' when user has no profile", async () => {
    const { getServerSession } = await import("@/lib/server/auth");
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "user-1" } });
    mockProfileService.getInstance.mockReturnValue({
      getProfile: vi.fn().mockResolvedValue(null),
    } as any);

    const result = await getServerTheme();
    expect(result).toBe("system");
  });

  it("should return user's theme from profile", async () => {
    const { getServerSession } = await import("@/lib/server/auth");
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "user-1" } });
    mockProfileService.getInstance.mockReturnValue({
      getProfile: vi.fn().mockResolvedValue({ theme: "dark" }),
    } as any);

    const result = await getServerTheme();
    expect(result).toBe("dark");
  });

  it("should return 'system' for invalid theme values", async () => {
    const { getServerSession } = await import("@/lib/server/auth");
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "user-1" } });
    mockProfileService.getInstance.mockReturnValue({
      getProfile: vi.fn().mockResolvedValue({ theme: "invalid" }),
    } as any);

    const result = await getServerTheme();
    expect(result).toBe("system");
  });

  it("should return 'system' on error", async () => {
    const { getServerSession } = await import("@/lib/server/auth");
    vi.mocked(getServerSession).mockRejectedValue(new Error("Database error"));

    await expect(async () => {
      const result = await getServerTheme();
      expect(result).toBe("system");
    }).toLogError(/Database error/);
  });
});

describe("resolveTheme", () => {
  it("should return 'light' for light theme", () => {
    expect(resolveTheme("light")).toBe("light");
  });

  it("should return 'dark' for dark theme", () => {
    expect(resolveTheme("dark")).toBe("dark");
  });

  it("should return 'system' for system theme", () => {
    expect(resolveTheme("system")).toBe("system");
  });
});
