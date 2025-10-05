import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
  id: "mock-socket-id",
};

const mockIo = vi.fn(() => mockSocket);

vi.mock("socket.io-client", () => ({
  io: mockIo,
}));

// Mock AuthProvider
const mockUseAuth = vi.fn();
vi.mock("@/components/AuthProvider", () => ({
  useAuth: mockUseAuth,
}));

describe("useSocket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();
    mockIo.mockClear();
  });

  it("should connect when user is not authenticated (anonymous)", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
    });

    const { useSocket } = await import("../useSocket");
    renderHook(() => useSocket());

    // The hook should call io to create a socket connection
    expect(mockIo).toHaveBeenCalledWith({
      withCredentials: true,
      autoConnect: true,
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
    });
  });

  it("should not connect while auth is loading", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      isLoading: true,
    });

    const { useSocket } = await import("../useSocket");
    const { result } = renderHook(() => useSocket());

    expect(mockIo).not.toHaveBeenCalled();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.socket).toBe(null);
  });

  it("should connect when user is authenticated", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", name: "Test User" },
      session: { token: "valid-token" },
      isLoading: false,
    });

    const { useSocket } = await import("../useSocket");
    const { result } = renderHook(() => useSocket());

    expect(mockIo).toHaveBeenCalledWith({
      withCredentials: true,
      autoConnect: true,
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
    });

    // Simulate connection
    const connectHandler = mockSocket.on.mock.calls.find(([event]) => event === "connect")?.[1];

    if (connectHandler) {
      await act(async () => {
        connectHandler();
      });
    }

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Should emit join:user event
    expect(mockSocket.emit).toHaveBeenCalledWith("join:user", "user-1");
  });

  it("should handle connection errors", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", name: "Test User" },
      session: { token: "valid-token" },
      isLoading: false,
    });

    const { useSocket } = await import("../useSocket");
    const { result } = renderHook(() => useSocket());

    // Simulate connection error
    const errorHandler = mockSocket.on.mock.calls.find(([event]) => event === "connect_error")?.[1];

    if (errorHandler) {
      await act(async () => {
        errorHandler(new Error("Connection failed"));
      });
    }

    await waitFor(() => {
      expect(result.current.error).toBe("Connection failed");
      expect(result.current.isConnected).toBe(false);
    });
  });

  it("should provide joinWishlist function", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", name: "Test User" },
      session: { token: "valid-token" },
      isLoading: false,
    });

    const { useSocket } = await import("../useSocket");
    const { result } = renderHook(() => useSocket());

    result.current.joinWishlist("wishlist-1");

    expect(mockSocket.emit).toHaveBeenCalledWith("join:wishlist", "wishlist-1");
  });

  it("should provide leaveWishlist function", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", name: "Test User" },
      session: { token: "valid-token" },
      isLoading: false,
    });

    const { useSocket } = await import("../useSocket");
    const { result } = renderHook(() => useSocket());

    result.current.leaveWishlist("wishlist-1");

    expect(mockSocket.emit).toHaveBeenCalledWith("leave:wishlist", "wishlist-1");
  });
});
