import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, expect, vi } from "vitest";
import { server } from "./mocks/server";
import "./matchers"; // Import custom matchers

// Extend Vitest's expect with jest-dom matchers
expect.extend({});

// Clean up after each test
afterEach(() => {
  cleanup();
});

// MSW server setup
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    has: vi.fn(),
    getAll: vi.fn(),
  }),
  usePathname: () => "/",
}));

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => {
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Suppress console warnings and expected errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = typeof args[0] === "string" ? args[0] : String(args[0]);

    // Suppress known test-related warnings and expected errors
    const suppressedMessages = [
      "Warning: ReactDOM.render is no longer supported",
      "Socket connection error:", // Expected WebSocket test errors
      "Error creating wishlist item:", // Expected API test errors
    ];

    if (suppressedMessages.some((msg) => message.includes(msg))) {
      return;
    }

    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock SocketContext globally for all tests
vi.mock("@/contexts/SocketContext", () => ({
  SocketProvider: ({ children }: { children: React.ReactNode }) => children,
  useSocketContext: () => ({
    isConnected: true,
    error: null,
    joinWishlist: vi.fn(),
    leaveWishlist: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }),
}));
