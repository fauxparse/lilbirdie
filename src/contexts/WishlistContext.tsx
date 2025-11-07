"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { uniqueId } from "es-toolkit/compat";
import { createContext, type ReactNode, useCallback, useContext, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { useWishlistRealtime } from "@/hooks/useWishlistRealtime";
import { UpdateWishlistData } from "@/lib/services/WishlistService";
import type {
  ClaimWithUser,
  WishlistItemResponse,
  WishlistResponse,
  WishlistWithItems,
} from "@/types";
import type { SerializedWishlist } from "@/types/serialized";

interface WishlistContextValue {
  wishlist: SerializedWishlist | undefined;
  isLoading: boolean;
  isOwner: boolean;
  error: Error | null;
  refetch: () => void;
  getItem: (itemId: string) => WishlistItemResponse | undefined;
  updateItemCache: (item: WishlistItemResponse) => void;
  removeItemFromCache: (itemId: string) => void;
  addItemToCache: (item: WishlistItemResponse) => void;
  updateWishlist: (data: Partial<UpdateWishlistData>) => void;
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
  initialData?: SerializedWishlist | null;
}

export function WishlistProvider({ children, permalink, initialData }: WishlistProviderProps) {
  const queryClient = useQueryClient();

  const { user } = useAuth();

  const {
    data: wishlist,
    isLoading,
    error,
    refetch,
  } = useQuery<SerializedWishlist>({
    queryKey: ["wishlist", permalink],
    queryFn: async () => {
      const response = await fetch(`/api/wishlists/${permalink}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("NOT_FOUND");
        }
        throw new Error("Failed to fetch wishlist");
      }
      return response.json();
    },
    initialData: initialData || undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Populate individual item cache entries when wishlist data is available
  useEffect(() => {
    if (wishlist?.items) {
      for (const item of wishlist.items) {
        queryClient.setQueryData(["item", item.id], item);
      }
    }
  }, [wishlist?.items, queryClient]);

  const updateCachedItem = useCallback(
    (itemId: string, updater: (item: WishlistItemResponse) => WishlistItemResponse) => {
      const existing = queryClient.getQueryData<WishlistItemResponse>(["item", itemId]);

      if (!existing) return;
      const updated = updater(existing);

      queryClient.setQueryData(["item", itemId], updated);

      queryClient.setQueryData(["wishlist", permalink], (oldData: WishlistResponse | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: oldData.items.map((item) => (item.id === itemId ? updated : item)),
        };
      });
    },
    [queryClient, permalink]
  );

  // Centralized claim mutation
  const claimMutation = useMutation({
    mutationFn: async ({
      itemId,
      action,
    }: {
      itemId: string;
      action: "claim" | "unclaim";
    }): Promise<{ claim: ClaimWithUser }> => {
      const method = action === "claim" ? "POST" : "DELETE";
      const response = await fetch(`/api/wishlists/${permalink}/items/${itemId}/claim`, {
        method,
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || `Failed to ${action} item`);
      }

      return response.json() as Promise<{ claim: ClaimWithUser }>;
    },
    onMutate: async ({ itemId, action }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["wishlist", permalink] });
      await queryClient.cancelQueries({ queryKey: ["item", itemId] });

      // Snapshot the previous values
      const previousWishlistData = queryClient.getQueryData(["wishlist", permalink]);
      const previousItemData = queryClient.getQueryData(["item", itemId]);

      if (action === "claim") {
        if (user) {
          updateCachedItem(itemId, (existing) => ({
            ...existing,
            claims: [
              ...(existing.claims || []).filter((claim) => claim.userId !== user?.id),
              {
                id: uniqueId("temp-"),
                user: {
                  id: user.id,
                  name: user.name,
                  image: user.image ?? null,
                },
                createdAt: new Date(),
                itemId,
                wishlistId: existing.wishlistId || "",
                userId: user.id,
                sent: false,
                sentAt: null,
              },
            ],
          }));
        }
      } else {
        updateCachedItem(itemId, (existing) => ({
          ...existing,
          claims: (existing.claims || []).filter((claim) => claim.userId !== user?.id),
        }));
      }

      return { previousWishlistData, previousItemData };
    },
    onError: (error, { itemId }, context) => {
      // Rollback on error
      if (context?.previousWishlistData) {
        queryClient.setQueryData(["wishlist", permalink], context.previousWishlistData);
      }
      if (context?.previousItemData) {
        queryClient.setQueryData(["item", itemId], context.previousItemData);
      }
      toast.error(error.message);
    },
    onSuccess: (data, { action }) => {
      const { itemId } = data.claim;
      if (action === "claim") {
        updateCachedItem(itemId, (existing) => ({
          ...existing,
          claims: [
            ...(existing.claims || []).filter((claim) => claim.userId !== user?.id),
            data.claim,
          ],
        }));
      } else {
        updateCachedItem(itemId, (existing) => ({
          ...existing,
          claims: (existing.claims || []).filter((claim) => claim.userId !== user?.id),
        }));
      }
    },
  });

  // Helper functions for cache management
  const getItem = (itemId: string): WishlistItemResponse | undefined => {
    return queryClient.getQueryData(["item", itemId]);
  };

  const updateItemCache = (item: WishlistItemResponse) => {
    queryClient.setQueryData(["item", item.id], item);

    // Update wishlist cache
    queryClient.setQueryData<WishlistResponse>(["wishlist", permalink], (oldData) => {
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
    queryClient.setQueryData<WishlistResponse>(["wishlist", permalink], (oldData) => {
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
    queryClient.setQueryData<WishlistResponse>(["wishlist", permalink], (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        items: [item, ...oldData.items.filter((i) => i.id !== item.id)],
      };
    });
  };

  const updateWishlist = useMutation({
    mutationFn: async (data: Partial<UpdateWishlistData>): Promise<WishlistWithItems> => {
      if (!wishlist) {
        throw new Error("Wishlist not found");
      }

      queryClient.setQueryData(
        ["wishlist", permalink],
        (existing: WishlistResponse | undefined) => ({
          ...(existing || {}),
          ...data,
        })
      );

      const response = await fetch(`/api/wishlists/${wishlist.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Failed to update wishlist");
      }

      return response.json() as Promise<WishlistWithItems>;
    },
    meta: { previous: queryClient.getQueryData(["wishlist", permalink]) },
    onSuccess: (updatedWishlist: WishlistResponse) => {
      queryClient.setQueryData<WishlistResponse>(["wishlist", permalink], (existing) => ({
        ...existing,
        ...updatedWishlist,
      }));
    },
    onError: (error, _, context: { previous: WishlistResponse | undefined } | undefined) => {
      if (context?.previous) {
        queryClient.setQueryData(["wishlist", permalink], context.previous);
      }
      toast.error(error.message);
    },
  });

  const value: WishlistContextValue = {
    wishlist,
    isLoading,
    isOwner: !!user && wishlist?.ownerId === user?.id,
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
    updateWishlist: updateWishlist.mutate,
  };

  return (
    <WishlistContext.Provider value={value}>
      <WishlistRealtimeProvider>{children}</WishlistRealtimeProvider>
    </WishlistContext.Provider>
  );
}

const WishlistRealtimeProvider = ({ children }: { children: ReactNode }) => {
  const { wishlist } = useWishlist();
  useWishlistRealtime(wishlist?.id || null);
  return children;
};
