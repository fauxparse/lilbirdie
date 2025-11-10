"use client";

import { useMutation } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext } from "react";
import { toast } from "sonner";
import type { WishlistItemResponse, WishlistItemWithRelations } from "@/types";
import { useWishlist } from "./WishlistContext";

interface ItemFormData {
  name: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  price?: number | null;
  currency?: "NZD" | "USD" | "AUD" | "EUR" | "GBP" | "CAD" | "JPY";
  priority?: number;
  tags?: string[];
}

interface WishlistItemContextValue {
  item: WishlistItemResponse | undefined;
  updateItem: (data: Partial<ItemFormData>) => void;
  isUpdating: boolean;
}

const WishlistItemContext = createContext<WishlistItemContextValue | undefined>(undefined);

export function useWishlistItem() {
  const context = useContext(WishlistItemContext);
  if (!context) {
    throw new Error("useWishlistItem must be used within a WishlistItemProvider");
  }
  return context;
}

interface WishlistItemProviderProps {
  children: ReactNode;
  itemId: string;
}

export function WishlistItemProvider({ children, itemId }: WishlistItemProviderProps) {
  const { getItem, updateItemCache, wishlist } = useWishlist();

  // First try to get from individual cache, then fall back to wishlist items
  const cachedItem = getItem(itemId);
  const wishlistItem = wishlist?.items.find((i) => i.id === itemId);
  const item = cachedItem || wishlistItem;

  const updateItemMutation = useMutation({
    mutationFn: async (data: Partial<ItemFormData>): Promise<WishlistItemWithRelations> => {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Failed to update item");
      }

      return response.json() as Promise<WishlistItemWithRelations>;
    },
    onSuccess: (updatedItem: WishlistItemResponse) => {
      updateItemCache(updatedItem);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateItem = (data: Partial<ItemFormData>) => {
    updateItemMutation.mutate(data);
  };

  const value: WishlistItemContextValue = {
    item,
    updateItem,
    isUpdating: updateItemMutation.isPending,
  };

  return <WishlistItemContext.Provider value={value}>{children}</WishlistItemContext.Provider>;
}
