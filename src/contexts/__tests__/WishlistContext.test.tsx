import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, vi } from "vitest";
import { server } from "../../test/mocks/server";
import { useWishlist, WishlistProvider } from "../WishlistContext";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Test component that uses the context
function TestComponent() {
  const {
    wishlist,
    isLoading,
    error,
    getItem,
    updateItemCache,
    addItemToCache,
    removeItemFromCache,
  } = useWishlist();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!wishlist) return <div>No wishlist</div>;

  return (
    <div>
      <div data-testid="wishlist-title">{wishlist.title}</div>
      <div data-testid="item-count">{wishlist.items.length}</div>
      <button
        type="button"
        onClick={() => {
          const item = getItem("item-1");
          if (item) {
            updateItemCache({ ...item, name: "Updated Item" });
          }
        }}
        data-testid="update-item"
      >
        Update Item
      </button>
      <button
        type="button"
        onClick={() =>
          addItemToCache({
            id: "new-item",
            name: "New Item",
            description: null,
            url: null,
            imageUrl: null,
            price: null,
            currency: "NZD",
            priority: 0,
            tags: [],
            isDeleted: false,
            wishlistId: "wishlist-1",
            createdAt: new Date("2023-01-01T00:00:00Z"),
            updatedAt: new Date("2023-01-01T00:00:00Z"),
            deletedAt: null,
            claims: [],
          })
        }
        data-testid="add-item"
      >
        Add Item
      </button>
      <button type="button" onClick={() => removeItemFromCache("item-1")} data-testid="remove-item">
        Remove Item
      </button>
    </div>
  );
}

function renderWithQueryClient(permalink: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <WishlistProvider permalink={permalink}>
        <TestComponent />
      </WishlistProvider>
    </QueryClientProvider>
  );
}

describe("WishlistContext", () => {
  // Disable MSW for this test suite since we're testing API requests
  beforeAll(() => {
    server.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Re-enable MSW after this test suite
  afterAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  it("fetches and displays wishlist data", async () => {
    const mockWishlist = {
      id: "wishlist-1",
      title: "Test Wishlist",
      permalink: "test-wishlist",
      items: [
        {
          id: "item-1",
          name: "Test Item",
          wishlistId: "wishlist-1",
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
          claims: [],
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWishlist,
    });

    renderWithQueryClient("test-wishlist");

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("wishlist-title")).toHaveTextContent("Test Wishlist");
      expect(screen.getByTestId("item-count")).toHaveTextContent("1");
    });
  });

  it("handles 404 error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    renderWithQueryClient("nonexistent");

    await waitFor(() => {
      expect(screen.getByText("Error: NOT_FOUND")).toBeInTheDocument();
    });
  });

  it("handles general fetch error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    renderWithQueryClient("test-wishlist");

    await waitFor(() => {
      expect(screen.getByText("Error: Failed to fetch wishlist")).toBeInTheDocument();
    });
  });

  it("throws error when used outside provider", () => {
    const TestWithoutProvider = () => {
      useWishlist();
      return null;
    };

    expect(() => render(<TestWithoutProvider />)).toThrow(
      "useWishlist must be used within a WishlistProvider"
    );
  });

  it("provides cache management functions", async () => {
    const mockWishlist = {
      id: "wishlist-1",
      title: "Test Wishlist",
      permalink: "test-wishlist",
      items: [
        {
          id: "item-1",
          name: "Test Item",
          wishlistId: "wishlist-1",
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
          claims: [],
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWishlist,
    });

    renderWithQueryClient("test-wishlist");

    await waitFor(() => {
      expect(screen.getByTestId("wishlist-title")).toBeInTheDocument();
    });

    // Test that cache management buttons are rendered
    expect(screen.getByTestId("update-item")).toBeInTheDocument();
    expect(screen.getByTestId("add-item")).toBeInTheDocument();
    expect(screen.getByTestId("remove-item")).toBeInTheDocument();
  });
});
