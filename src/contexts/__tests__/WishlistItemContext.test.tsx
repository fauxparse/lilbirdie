import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, beforeEach, vi } from "vitest";
import { server } from "../../test/mocks/server";
import { WishlistProvider } from "../WishlistContext";
import { useWishlistItem, WishlistItemProvider } from "../WishlistItemContext";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Test component that uses the WishlistItemContext
function TestItemComponent() {
  const { item, updateItem, isUpdating } = useWishlistItem();

  if (!item) return <div>No item</div>;

  return (
    <div>
      <div data-testid="item-name">{item.name}</div>
      <div data-testid="item-priority">{item.priority || 0}</div>
      <div data-testid="updating-status">{isUpdating ? "Updating..." : "Ready"}</div>
      <button
        type="button"
        onClick={() => updateItem({ name: "Updated Name" })}
        data-testid="update-name"
        disabled={isUpdating}
      >
        Update Name
      </button>
      <button
        type="button"
        onClick={() => updateItem({ priority: 5 })}
        data-testid="update-priority"
        disabled={isUpdating}
      >
        Update Priority
      </button>
    </div>
  );
}

function renderWithProviders(permalink: string, itemId: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  // Set up initial item data in cache
  const mockItem = {
    id: itemId,
    name: "Test Item",
    wishlistId: "wishlist-1",
    priority: 3,
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
    claims: [],
  };

  queryClient.setQueryData(["item", itemId], mockItem);

  const mockWishlist = {
    id: "wishlist-1",
    title: "Test Wishlist",
    permalink,
    items: [mockItem],
  };

  queryClient.setQueryData(["public-wishlist", permalink], mockWishlist);

  return render(
    <QueryClientProvider client={queryClient}>
      <WishlistProvider permalink={permalink}>
        <WishlistItemProvider itemId={itemId}>
          <TestItemComponent />
        </WishlistItemProvider>
      </WishlistProvider>
    </QueryClientProvider>
  );
}

describe("WishlistItemContext", () => {
  const user = userEvent.setup();

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

  it("provides item data from cache", async () => {
    renderWithProviders("test-wishlist", "item-1");

    expect(screen.getByTestId("item-name")).toHaveTextContent("Test Item");
    expect(screen.getByTestId("item-priority")).toHaveTextContent("3");
    expect(screen.getByTestId("updating-status")).toHaveTextContent("Ready");
  });

  it("handles missing item data", () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <WishlistProvider permalink="test-wishlist">
          <WishlistItemProvider itemId="nonexistent">
            <TestItemComponent />
          </WishlistItemProvider>
        </WishlistProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText("No item")).toBeInTheDocument();
  });

  it("calls API with correct parameters when updating", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "item-1",
        name: "Updated Name",
        wishlistId: "wishlist-1",
        priority: 3,
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-02T00:00:00Z",
        claims: [],
      }),
    });

    renderWithProviders("test-wishlist", "item-1");

    await user.click(screen.getByTestId("update-name"));

    expect(fetch).toHaveBeenCalledWith("/api/items/item-1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Updated Name" }),
    });
  });

  it("handles API errors properly", async () => {
    const mockError = { error: "Update failed" };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => mockError,
    });

    renderWithProviders("test-wishlist", "item-1");

    await user.click(screen.getByTestId("update-priority"));

    expect(fetch).toHaveBeenCalledWith("/api/items/item-1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ priority: 5 }),
    });

    // Verify mutation completed (status should be Ready again)
    await waitFor(() => {
      expect(screen.getByTestId("updating-status")).toHaveTextContent("Ready");
    });
  });

  it("throws error when used outside WishlistItemProvider", () => {
    const TestWithoutProvider = () => {
      useWishlistItem();
      return null;
    };

    expect(() => render(<TestWithoutProvider />)).toThrow(
      "useWishlistItem must be used within a WishlistItemProvider"
    );
  });

  it("throws error when used outside WishlistProvider", () => {
    const queryClient = new QueryClient();

    const TestWithoutWishlistProvider = () => (
      <QueryClientProvider client={queryClient}>
        <WishlistItemProvider itemId="item-1">
          <TestItemComponent />
        </WishlistItemProvider>
      </QueryClientProvider>
    );

    expect(() => render(<TestWithoutWishlistProvider />)).toThrow(
      "useWishlist must be used within a WishlistProvider"
    );
  });

  it("provides updateItem function that calls mutation", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "item-1",
        name: "Test Item",
        wishlistId: "wishlist-1",
        priority: 5,
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-02T00:00:00Z",
        claims: [],
      }),
    });

    renderWithProviders("test-wishlist", "item-1");

    // Verify initial state
    expect(screen.getByTestId("item-priority")).toHaveTextContent("3");

    await user.click(screen.getByTestId("update-priority"));

    // Verify the API was called correctly
    expect(fetch).toHaveBeenCalledWith("/api/items/item-1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ priority: 5 }),
    });
  });
});
