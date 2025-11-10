import type { Claim, Occasion, User, Wishlist, WishlistItem } from "@prisma/client";

// Base types from Prisma
export type { User, WishlistItem, Claim, Wishlist, Occasion };

/**
 * MinimalUser - Common interface for user objects in UI components
 *
 * This represents the minimal shape of a user that UI components need.
 * Both Better Auth session users and SerializedUser are compatible with this type.
 * Use this for component props instead of defining local User interfaces.
 */
export interface MinimalUser {
  id: string;
  name?: string | null;
  email?: string;
  image?: string | null;
}

export interface Profile {
  id: string;
  userId: string;
  birthday: Date | null;
  preferredCurrency: string;
  theme: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extended types with relations
export interface UserWithProfile extends User {
  profile?: Profile;
}

export interface ClaimWithUser extends Claim {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

// Client-side types with number price instead of Decimal and nullable currency
export interface ClientWishlistItem extends Omit<WishlistItem, "price" | "currency"> {
  price: number | null;
  currency: string | null;
}

export interface WishlistItemWithClaims extends ClientWishlistItem {
  claims?: ClaimWithUser[];
}

export interface WishlistItemWithRelations extends ClientWishlistItem {
  claims?: ClaimWithUser[];
  wishlist?: {
    id: string;
    title: string;
    owner: {
      id: string;
      name: string | null;
      image: string | null;
    } | null;
  };
}

export interface WishlistWithItems extends Wishlist {
  items: WishlistItemWithClaims[];
  owner: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  occasions: Occasion[];
  friendshipStatus: "friends" | "none" | "pending_sent" | "pending_received";
}

// API response types
export type WishlistItemResponse = WishlistItemWithRelations;
export type WishlistResponse = WishlistWithItems;

// Service data types
export interface CreateWishlistItemData {
  name: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  blurhash?: string;
  price?: number;
  currency?: string;
  priority?: number;
  tags?: string[];
}

export interface UpdateWishlistItemData {
  name?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  blurhash?: string;
  price?: number;
  currency?: string;
  priority?: number;
  tags?: string[];
}
