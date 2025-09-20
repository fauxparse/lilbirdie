import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
const mockQueryClient = {
  invalidateQueries: vi.fn(),
};

const mockSocketContext = {
  isConnected: true,
  error: null,
  on: vi.fn(),
  off: vi.fn(),
  joinWishlist: vi.fn(),
  leaveWishlist: vi.fn(),
};

const mockUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  image: undefined,
};

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mockQueryClient,
}));

vi.mock("@/contexts/SocketContext", () => ({
  useSocketContext: () => mockSocketContext,
}));

vi.mock("@/components/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
  },
}));

describe("useFriendRealtime", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset socket context state
    mockSocketContext.isConnected = true;

    // Import and set default auth user
    const { useAuth } = await import("@/components/AuthProvider");
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      session: null,
      isLoading: false,
    });
  });

  it("should not set up listeners when user is not authenticated", async () => {
    const { useAuth } = await import("@/components/AuthProvider");
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
    });

    const { useFriendRealtime } = await import("../useFriendRealtime");
    renderHook(() => useFriendRealtime());

    expect(mockSocketContext.on).not.toHaveBeenCalled();
  });

  it("should not set up listeners when not connected", async () => {
    mockSocketContext.isConnected = false;

    const { useFriendRealtime } = await import("../useFriendRealtime");
    renderHook(() => useFriendRealtime());

    expect(mockSocketContext.on).not.toHaveBeenCalled();
  });

  it("should set up event listeners when user is authenticated and connected", async () => {
    const { useFriendRealtime } = await import("../useFriendRealtime");
    renderHook(() => useFriendRealtime());

    expect(mockSocketContext.on).toHaveBeenCalledWith("friend:request", expect.any(Function));
    expect(mockSocketContext.on).toHaveBeenCalledWith("friend:accepted", expect.any(Function));
  });

  it("should handle friend:request event", async () => {
    const { useFriendRealtime } = await import("../useFriendRealtime");
    renderHook(() => useFriendRealtime());

    const requestHandler = mockSocketContext.on.mock.calls.find(
      ([event]) => event === "friend:request"
    )?.[1];

    requestHandler?.({
      requestId: "req-1",
      requesterId: "user-2",
    });

    // Should invalidate friend requests query
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["friend-requests", "user-1"],
    });

    // Should show toast notification
    const { toast } = (await vi.importMock("sonner")) as { toast: { info: any; success: any } };
    expect(toast.info).toHaveBeenCalledWith("You have a new friend request!", {
      description: "Check your notifications to respond.",
      duration: 5000,
    });
  });

  it("should handle friend:accepted event", async () => {
    const { useFriendRealtime } = await import("../useFriendRealtime");
    renderHook(() => useFriendRealtime());

    const acceptedHandler = mockSocketContext.on.mock.calls.find(
      ([event]) => event === "friend:accepted"
    )?.[1];

    acceptedHandler?.({
      friendshipId: "friendship-1",
      userId: "user-2",
    });

    // Should invalidate both friends and friend requests queries
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["friends", "user-1"],
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["friend-requests", "user-1"],
    });

    // Should show success toast
    const { toast } = (await vi.importMock("sonner")) as { toast: { info: any; success: any } };
    expect(toast.success).toHaveBeenCalledWith("Friend request accepted!", {
      description: "You are now friends and can see each other's wishlists.",
      duration: 5000,
    });
  });

  it("should clean up event listeners on unmount", async () => {
    const { useFriendRealtime } = await import("../useFriendRealtime");
    const { unmount } = renderHook(() => useFriendRealtime());

    unmount();

    expect(mockSocketContext.off).toHaveBeenCalledWith("friend:request", expect.any(Function));
    expect(mockSocketContext.off).toHaveBeenCalledWith("friend:accepted", expect.any(Function));
  });

  it("should handle user changes", async () => {
    const { useFriendRealtime } = await import("../useFriendRealtime");
    const { rerender } = renderHook(() => useFriendRealtime());

    // Initially sets up listeners
    expect(mockSocketContext.on).toHaveBeenCalledTimes(2);

    // Clear mocks
    vi.clearAllMocks();

    // User logs out
    const { useAuth } = await import("@/components/AuthProvider");
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
    });

    rerender();

    // Should clean up existing listeners
    expect(mockSocketContext.off).toHaveBeenCalledWith("friend:request", expect.any(Function));
    expect(mockSocketContext.off).toHaveBeenCalledWith("friend:accepted", expect.any(Function));

    // Should not set up new listeners
    expect(mockSocketContext.on).not.toHaveBeenCalled();
  });

  it("should handle connection state changes", async () => {
    const { useFriendRealtime } = await import("../useFriendRealtime");
    const { rerender } = renderHook(() => useFriendRealtime());

    // Initially connected and sets up listeners
    expect(mockSocketContext.on).toHaveBeenCalledTimes(2);

    // Clear mocks
    vi.clearAllMocks();

    // Disconnect
    mockSocketContext.isConnected = false;

    rerender();

    // Should clean up existing listeners
    expect(mockSocketContext.off).toHaveBeenCalledWith("friend:request", expect.any(Function));
    expect(mockSocketContext.off).toHaveBeenCalledWith("friend:accepted", expect.any(Function));

    // Should not set up new listeners
    expect(mockSocketContext.on).not.toHaveBeenCalled();
  });
});
