"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useEffect } from "react";
import { toast } from "sonner";
import type { WishlistItemResponse, WishlistResponse } from "@/types";

interface WishlistContextValue {
  wishlist: WishlistResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  getItem: (itemId: string) => WishlistItemResponse | undefined;
  updateItemCache: (item: WishlistItemResponse) => void;
  removeItemFromCache: (itemId: string) => void;
  addItemToCache: (item: WishlistItemResponse) => void;
  claimMutation: {
    mutate: (params: { itemId: string; action: "claim" | "unclaim" }) => void;
    isPending: boolean;
  };
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}

interface WishlistProviderProps {
  children: ReactNode;
  permalink: string;
}

export function WishlistProvider({ children, permalink }: WishlistProviderProps) {
  const queryClient = useQueryClient();

  const {
    data: wishlist,
    isLoading,
    error,
    refetch,
  } = useQuery<WishlistResponse>({
    queryKey: ["public-wishlist", permalink],
    queryFn: async () => {
      const response = await fetch(`/api/w/${permalink}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("NOT_FOUND");
        }
        throw new Error("Failed to fetch wishlist");
      }
      return response.json();
    },
  });

  // Populate individual item cache entries when wishlist data is available
  useEffect(() => {
    if (wishlist?.items) {
      for (const item of wishlist.items) {
        queryClient.setQueryData(["item", item.id], item);
      }
    }
  }, [wishlist?.items, queryClient]);

  // Centralized claim mutation
  const claimMutation = useMutation({
    mutationFn: async ({ itemId, action }: { itemId: string; action: "claim" | "unclaim" }) => {
      const method = action === "claim" ? "POST" : "DELETE";
      const response = await fetch(`/api/w/${permalink}/items/${itemId}/claim`, {
        method,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} item`);
      }

      return response.json();
    },
    onMutate: async ({ itemId, action }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["public-wishlist", permalink] });
      await queryClient.cancelQueries({ queryKey: ["item", itemId] });

      // Snapshot the previous values
      const previousWishlistData = queryClient.getQueryData(["public-wishlist", permalink]);
      const previousItemData = queryClient.getQueryData(["item", itemId]);

      // Optimistically update the item cache
      queryClient.setQueryData(["item", itemId], (oldData: WishlistItemResponse | undefined) => {
        if (!oldData) return oldData;

        if (action === "claim") {
          // Add the claim (we'll get the real data from the server)
          return {
            ...oldData,
            claims: [
              ...(oldData.claims || []),
              {
                id: "temp",
                userId: "current-user", // This will be replaced by server response
                itemId,
                wishlistId: oldData.wishlistId || "",
                createdAt: new Date().toISOString(),
                user: null, // Will be populated by server
                sent: false,
                sentAt: null,
              },
            ],
          };
        } else {
          // Remove claims for current user
          return {
            ...oldData,
            claims: (oldData.claims || []).filter((claim) => claim.userId !== "current-user"),
          };
        }
      });

      // Optimistically update the wishlist cache
      queryClient.setQueryData(
        ["public-wishlist", permalink],
        (oldData: WishlistResponse | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            items: oldData.items.map((item) => {
              if (item.id === itemId) {
                const updatedItem = queryClient.getQueryData<WishlistItemResponse>([
                  "item",
                  itemId,
                ]);
                return updatedItem || item;
              }
              return item;
            }),
          };
        }
      );

      return { previousWishlistData, previousItemData };
    },
    onError: (error, { itemId }, context) => {
      // Rollback on error
      if (context?.previousWishlistData) {
        queryClient.setQueryData(["public-wishlist", permalink], context.previousWishlistData);
      }
      if (context?.previousItemData) {
        queryClient.setQueryData(["item", itemId], context.previousItemData);
      }
      toast.error(error.message);
    },
    onSuccess: () => {
      // Invalidate to get fresh data from server
      queryClient.invalidateQueries({ queryKey: ["public-wishlist", permalink] });
    },
  });

  // Helper functions for cache management
  const getItem = (itemId: string): WishlistItemResponse | undefined => {
    return queryClient.getQueryData(["item", itemId]);
  };

  const updateItemCache = (item: WishlistItemResponse) => {
    queryClient.setQueryData(["item", item.id], item);

    // Update wishlist cache
    queryClient.setQueryData<WishlistResponse>(["public-wishlist", permalink], (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        items: oldData.items.map((existingItem) =>
          existingItem.id === item.id ? item : existingItem
        ),
      };
    });
  };

  const removeItemFromCache = (itemId: string) => {
    queryClient.removeQueries({ queryKey: ["item", itemId] });

    // Update wishlist cache
    queryClient.setQueryData<WishlistResponse>(["public-wishlist", permalink], (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        items: oldData.items.filter((item) => item.id !== itemId),
      };
    });
  };

  const addItemToCache = (item: WishlistItemResponse) => {
    queryClient.setQueryData(["item", item.id], item);

    // Update wishlist cache
    queryClient.setQueryData<WishlistResponse>(["public-wishlist", permalink], (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        items: [item, ...oldData.items],
      };
    });
  };

  const value: WishlistContextValue = {
    wishlist,
    isLoading,
    error,
    refetch,
    getItem,
    updateItemCache,
    removeItemFromCache,
    addItemToCache,
    claimMutation: {
      mutate: claimMutation.mutate,
      isPending: claimMutation.isPending,
    },
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
