import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the socket context
const mockSocketContext = {
  isConnected: true,
  error: null,
  joinWishlist: vi.fn(),
  leaveWishlist: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock("@/contexts/SocketContext", () => ({
  useSocketContext: vi.fn(() => mockSocketContext),
}));

// Mock React Query
const mockQueryClient = {
  invalidateQueries: vi.fn(),
  removeQueries: vi.fn(),
};

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: vi.fn(() => mockQueryClient),
}));

describe("useWishlistRealtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not join wishlist when wishlistId is null", async () => {
    const { useWishlistRealtime } = await import("../useWishlistRealtime");
    renderHook(() => useWishlistRealtime(null));

    expect(mockSocketContext.joinWishlist).not.toHaveBeenCalled();
    expect(mockSocketContext.on).not.toHaveBeenCalled();
  });

  it("should not join wishlist when not connected", async () => {
    // Set up disconnected context
    mockSocketContext.isConnected = false;

    const { useWishlistRealtime } = await import("../useWishlistRealtime");
    renderHook(() => useWishlistRealtime("wishlist-1"));

    expect(mockSocketContext.joinWishlist).not.toHaveBeenCalled();

    // Reset for other tests
    mockSocketContext.isConnected = true;
  });

  it("should join wishlist and set up event listeners when connected", async () => {
    const { useWishlistRealtime } = await import("../useWishlistRealtime");
    renderHook(() => useWishlistRealtime("wishlist-1"));

    expect(mockSocketContext.joinWishlist).toHaveBeenCalledWith("wishlist-1");

    // Should register all event listeners
    expect(mockSocketContext.on).toHaveBeenCalledWith("wishlist:item:added", expect.any(Function));
    expect(mockSocketContext.on).toHaveBeenCalledWith(
      "wishlist:item:updated",
      expect.any(Function)
    );
    expect(mockSocketContext.on).toHaveBeenCalledWith(
      "wishlist:item:deleted",
      expect.any(Function)
    );
    expect(mockSocketContext.on).toHaveBeenCalledWith("wishlist:updated", expect.any(Function));
    expect(mockSocketContext.on).toHaveBeenCalledWith("claim:created", expect.any(Function));
    expect(mockSocketContext.on).toHaveBeenCalledWith("claim:removed", expect.any(Function));
  });

  it("should handle wishlist:item:added event", async () => {
    const { useWishlistRealtime } = await import("../useWishlistRealtime");
    renderHook(() => useWishlistRealtime("wishlist-1"));

    // Find the item added handler
    const addedHandler = mockSocketContext.on.mock.calls.find(
      ([event]) => event === "wishlist:item:added"
    )?.[1];

    // Simulate event
    addedHandler?.({ itemId: "item-1", wishlistId: "wishlist-1" });

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["public-wishlist"],
    });
  });

  it("should handle wishlist:item:updated event", async () => {
    const { useWishlistRealtime } = await import("../useWishlistRealtime");
    renderHook(() => useWishlistRealtime("wishlist-1"));

    const updatedHandler = mockSocketContext.on.mock.calls.find(
      ([event]) => event === "wishlist:item:updated"
    )?.[1];

    updatedHandler?.({ itemId: "item-1", wishlistId: "wishlist-1" });

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["public-wishlist"],
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["item", "item-1"],
    });
  });

  it("should handle wishlist:item:deleted event", async () => {
    const { useWishlistRealtime } = await import("../useWishlistRealtime");
    renderHook(() => useWishlistRealtime("wishlist-1"));

    const deletedHandler = mockSocketContext.on.mock.calls.find(
      ([event]) => event === "wishlist:item:deleted"
    )?.[1];

    deletedHandler?.({ itemId: "item-1", wishlistId: "wishlist-1" });

    expect(mockQueryClient.removeQueries).toHaveBeenCalledWith({
      queryKey: ["item", "item-1"],
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["public-wishlist"],
    });
  });

  it("should handle claim:created event", async () => {
    const { useWishlistRealtime } = await import("../useWishlistRealtime");
    renderHook(() => useWishlistRealtime("wishlist-1"));

    const claimCreatedHandler = mockSocketContext.on.mock.calls.find(
      ([event]) => event === "claim:created"
    )?.[1];

    claimCreatedHandler?.({
      itemId: "item-1",
      wishlistId: "wishlist-1",
      userId: "user-1",
    });

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["public-wishlist"],
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["item", "item-1"],
    });
  });

  it("should clean up on unmount", async () => {
    const { useWishlistRealtime } = await import("../useWishlistRealtime");
    const { unmount } = renderHook(() => useWishlistRealtime("wishlist-1"));

    unmount();

    expect(mockSocketContext.off).toHaveBeenCalledWith("wishlist:item:added", expect.any(Function));
    expect(mockSocketContext.off).toHaveBeenCalledWith(
      "wishlist:item:updated",
      expect.any(Function)
    );
    expect(mockSocketContext.off).toHaveBeenCalledWith(
      "wishlist:item:deleted",
      expect.any(Function)
    );
    expect(mockSocketContext.off).toHaveBeenCalledWith("wishlist:updated", expect.any(Function));
    expect(mockSocketContext.off).toHaveBeenCalledWith("claim:created", expect.any(Function));
    expect(mockSocketContext.off).toHaveBeenCalledWith("claim:removed", expect.any(Function));

    expect(mockSocketContext.leaveWishlist).toHaveBeenCalledWith("wishlist-1");
  });

  it("should handle wishlist ID changes", async () => {
    const { useWishlistRealtime } = await import("../useWishlistRealtime");
    const { rerender } = renderHook(({ wishlistId }) => useWishlistRealtime(wishlistId), {
      initialProps: { wishlistId: "wishlist-1" },
    });

    // Should initially join wishlist-1
    expect(mockSocketContext.joinWishlist).toHaveBeenCalledWith("wishlist-1");

    // Change to different wishlist
    rerender({ wishlistId: "wishlist-2" });

    // Should leave old wishlist and join new one
    expect(mockSocketContext.leaveWishlist).toHaveBeenCalledWith("wishlist-1");
    expect(mockSocketContext.joinWishlist).toHaveBeenCalledWith("wishlist-2");
  });
});
