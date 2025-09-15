import type { Claim, User, Wishlist, WishlistItem } from "@prisma/client";

// Base types from Prisma
export type { User, WishlistItem, Claim, Wishlist };

// Extended types with relations
export interface UserWithProfile extends User {
  profile?: {
    id: string;
    userId: string;
    birthday: Date | null;
    preferredCurrency: string;
    theme: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface ClaimWithUser extends Claim {
  user: Pick<User, "id" | "name" | "email" | "image">;
}

export interface WishlistItemWithClaims extends WishlistItem {
  claims?: ClaimWithUser[];
}

export interface WishlistItemWithRelations extends WishlistItem {
  claims?: ClaimWithUser[];
  wishlist?: {
    id: string;
    title: string;
    owner: Pick<User, "id" | "name" | "email">;
  };
}

export interface WishlistWithItems extends Wishlist {
  items: WishlistItemWithClaims[];
  owner: Pick<User, "id" | "name" | "email">;
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
  price?: number;
  currency?: string;
  priority?: number;
  tags?: string[];
}

// Component prop types
export interface WishlistItemCardProps {
  itemId: string;
  wishlistPermalink: string;
  isOwner: boolean;
  onClaim?: (itemId: string, isClaimed: boolean) => void;
  onEdit?: (item: WishlistItemResponse) => void;
  onDelete?: (itemId: string) => void;
  isClaimPending?: boolean;
}
