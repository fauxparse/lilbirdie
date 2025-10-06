import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "../route";

// Mock the auth module
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock the PermissionService
const mockPermissionService = {
  getUserPermissions: vi.fn(),
  getUserWishlistRole: vi.fn(),
};

vi.mock("@/lib/services/PermissionService", () => ({
  PermissionService: {
    getInstance: vi.fn(() => mockPermissionService),
  },
}));

// Mock the database
vi.mock("@/lib/db", () => ({
  prisma: {
    wishlist: {
      findUnique: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
    },
  },
}));

describe("GET /api/permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return permissions for authenticated user with wishlist context", async () => {
    const { auth } = await import("@/lib/auth");

    // Mock session
    const mockSession = {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    // Mock wishlist lookup (using actual ID, not permalink)
    const mockPermissions = [
      "wishlists:read",
      "wishlists:write",
      "items:read",
      "items:write",
      "friends:invite",
      "friends:manage",
    ];

    mockPermissionService.getUserPermissions.mockResolvedValue(mockPermissions);
    mockPermissionService.getUserWishlistRole.mockResolvedValue("owner");

    // Create request
    const request = new NextRequest(
      "http://localhost:3000/api/permissions?wishlistId=cwishlist123"
    );

    // Call the API
    const response = await GET(request);

    // Should return success
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData).toEqual({
      permissions: mockPermissions,
      role: "owner",
      userId: "user-1",
      context: {
        wishlistId: "cwishlist123",
        organizationId: null,
      },
    });

    // Should call permission service with correct context
    expect(mockPermissionService.getUserPermissions).toHaveBeenCalledWith({
      userId: "user-1",
      wishlistId: "cwishlist123",
    });

    expect(mockPermissionService.getUserWishlistRole).toHaveBeenCalledWith(
      "user-1",
      "cwishlist123"
    );
  });

  it("should resolve permalink to wishlist ID", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/db");

    // Mock session
    const mockSession = {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    // Mock wishlist lookup by permalink
    vi.mocked(prisma.wishlist.findUnique).mockResolvedValue({
      id: "cwishlist123",
    } as any);

    const mockPermissions = ["wishlists:read", "friends:invite", "friends:manage"];
    mockPermissionService.getUserPermissions.mockResolvedValue(mockPermissions);
    mockPermissionService.getUserWishlistRole.mockResolvedValue("viewer");

    // Create request with permalink
    const request = new NextRequest("http://localhost:3000/api/permissions?wishlistId=my-wishlist");

    // Call the API
    const response = await GET(request);

    // Should return success
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData.role).toBe("viewer");

    // Should resolve permalink to ID
    expect(prisma.wishlist.findUnique).toHaveBeenCalledWith({
      where: { permalink: "my-wishlist" },
      select: { id: true },
    });

    expect(mockPermissionService.getUserWishlistRole).toHaveBeenCalledWith(
      "user-1",
      "cwishlist123"
    );
  });

  it("should return permissions for organization context", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/db");

    // Mock session
    const mockSession = {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    // Mock organization member lookup
    vi.mocked(prisma.member.findFirst).mockResolvedValue({
      role: "admin",
    } as any);

    const mockPermissions = ["wishlists:read", "friends:invite", "friends:manage"];
    mockPermissionService.getUserPermissions.mockResolvedValue(mockPermissions);

    // Create request with organization context
    const request = new NextRequest("http://localhost:3000/api/permissions?organizationId=org-1");

    // Call the API
    const response = await GET(request);

    // Should return success
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData).toEqual({
      permissions: mockPermissions,
      role: "admin",
      userId: "user-1",
      context: {
        wishlistId: null,
        organizationId: "org-1",
      },
    });
  });

  it("should return 401 when user is not authenticated", async () => {
    const { auth } = await import("@/lib/auth");

    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/permissions");

    const response = await GET(request);

    expect(response.status).toBe(401);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: "Unauthorized" });
  });

  it("should return 404 when wishlist permalink not found", async () => {
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/db");

    // Mock session
    const mockSession = {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    // Mock wishlist not found
    vi.mocked(prisma.wishlist.findUnique).mockResolvedValue(null);

    // Create request with non-existent permalink
    const request = new NextRequest("http://localhost:3000/api/permissions?wishlistId=nonexistent");

    // Call the API
    const response = await GET(request);

    expect(response.status).toBe(404);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: "Wishlist not found" });
  });

  it("should return global permissions when no context provided", async () => {
    const { auth } = await import("@/lib/auth");

    // Mock session
    const mockSession = {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    const mockPermissions = ["friends:invite", "friends:manage"];
    mockPermissionService.getUserPermissions.mockResolvedValue(mockPermissions);

    // Create request with no context
    const request = new NextRequest("http://localhost:3000/api/permissions");

    // Call the API
    const response = await GET(request);

    // Should return success
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData).toEqual({
      permissions: mockPermissions,
      role: undefined,
      userId: "user-1",
      context: {
        wishlistId: null,
        organizationId: null,
      },
    });

    // Should call permission service with user-only context
    expect(mockPermissionService.getUserPermissions).toHaveBeenCalledWith({
      userId: "user-1",
    });
  });

  it("should return 500 for unexpected errors", async () => {
    const { auth } = await import("@/lib/auth");

    // Mock session
    const mockSession = {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
    } as any;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

    // Mock service error
    mockPermissionService.getUserPermissions.mockRejectedValue(new Error("Database error"));

    const request = new NextRequest("http://localhost:3000/api/permissions");

    const response = await GET(request);

    expect(response.status).toBe(500);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: "Failed to fetch permissions" });
  });
});
