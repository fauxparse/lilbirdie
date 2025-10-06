import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSocketContext } from "@/contexts/SocketContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { ClaimWithUser, WishlistItemResponse } from "@/types";

export function useWishlistRealtime(wishlistId: string | null) {
  const queryClient = useQueryClient();
  const { joinWishlist, leaveWishlist, on, off, isConnected } = useSocketContext();
  const { getItem, updateItemCache, addItemToCache, removeItemFromCache } = useWishlist();

  useEffect(() => {
    if (!wishlistId || !isConnected) {
      return;
    }

    // Join the wishlist room
    joinWishlist(wishlistId);

    // Define event handlers
    const handleItemAdded = (data: { item: WishlistItemResponse; wishlistId: string }) => {
      addItemToCache(data.item);
    };

    const handleItemUpdated = (data: { itemId: string; wishlistId: string }) => {
      // Invalidate wishlist queries to show updated item
      queryClient.invalidateQueries({
        queryKey: ["wishlist"],
      });
      // Also invalidate individual item query if it exists
      queryClient.invalidateQueries({
        queryKey: ["item", data.itemId],
      });
    };

    const handleItemDeleted = (data: { itemId: string; wishlistId: string }) => {
      removeItemFromCache(data.itemId);
    };

    const handleWishlistUpdated = (_data: { wishlistId: string }) => {
      // Invalidate wishlist queries to show metadata changes
      queryClient.invalidateQueries({
        queryKey: ["wishlist"],
      });
    };

    const handleClaimCreated = (data: { claim: ClaimWithUser }) => {
      const item = getItem(data.claim.itemId);
      if (item) {
        updateItemCache({
          ...item,
          claims: [...(item.claims || []), data.claim],
        });
      }
    };

    const handleClaimRemoved = (data: { itemId: string; wishlistId: string; userId: string }) => {
      const item = getItem(data.itemId);
      if (item) {
        updateItemCache({
          ...item,
          claims: (item.claims || []).filter((claim) => claim.userId !== data.userId),
        });
      }
    };

    // Register event listeners
    on("wishlist:item:added", handleItemAdded);
    on("wishlist:item:updated", handleItemUpdated);
    on("wishlist:item:deleted", handleItemDeleted);
    on("wishlist:updated", handleWishlistUpdated);
    on("claim:created", handleClaimCreated);
    on("claim:removed", handleClaimRemoved);

    // Cleanup function
    return () => {
      // Unregister event listeners
      off("wishlist:item:added", handleItemAdded);
      off("wishlist:item:updated", handleItemUpdated);
      off("wishlist:item:deleted", handleItemDeleted);
      off("wishlist:updated", handleWishlistUpdated);
      off("claim:created", handleClaimCreated);
      off("claim:removed", handleClaimRemoved);

      // Leave the wishlist room
      leaveWishlist(wishlistId);
    };
  }, [
    wishlistId,
    isConnected,
    joinWishlist,
    leaveWishlist,
    on,
    off,
    queryClient,
    getItem,
    updateItemCache,
    addItemToCache,
    removeItemFromCache,
  ]);
}
