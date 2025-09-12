import { type RenderOptions, render as rtlRender } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";

// Custom render function that sets up providers
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  // Add provider props here when needed (e.g., router, theme, etc.)
}

function render(ui: ReactElement, options: CustomRenderOptions = {}) {
  // You can add providers here as your app grows
  // const Wrapper = ({ children }: { children: React.ReactNode }) => {
  //   return (
  //     <ThemeProvider>
  //       <QueryProvider>
  //         {children}
  //       </QueryProvider>
  //     </ThemeProvider>
  //   );
  // };

  return {
    user: userEvent.setup(),
    ...rtlRender(ui, options),
  };
}

// Test data factories
export const mockUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  emailVerified: true,
  birthday: new Date("1990-01-01"),
  preferredCurrency: "USD",
  theme: "system",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockWishlist = {
  id: "wishlist-1",
  title: "Test Wishlist",
  description: "A test wishlist",
  permalink: "test-wishlist",
  privacy: "FRIENDS_ONLY" as const,
  isDefault: true,
  ownerId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockWishlistItem = {
  id: "item-1",
  name: "Test Item",
  description: "A test item",
  url: "https://example.com",
  imageUrl: null,
  price: 29.99,
  currency: "USD",
  priority: 2,
  tags: ["test"],
  isDeleted: false,
  wishlistId: "wishlist-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

export const mockFriendship = {
  id: "friendship-1",
  userId: "user-1",
  friendId: "user-2",
  createdAt: new Date(),
};

export const mockFriendRequest = {
  id: "request-1",
  email: "friend@example.com",
  requesterId: "user-1",
  receiverId: "user-2",
  status: "PENDING" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Re-export everything from testing-library
export * from "@testing-library/react";
export { render };
