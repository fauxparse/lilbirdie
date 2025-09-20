import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSocketContext } from "@/contexts/SocketContext";

export function useWishlistRealtime(wishlistId: string | null) {
  const queryClient = useQueryClient();
  const { joinWishlist, leaveWishlist, on, off, isConnected } = useSocketContext();

  useEffect(() => {
    if (!wishlistId || !isConnected) {
      return;
    }

    // Join the wishlist room
    joinWishlist(wishlistId);

    // Define event handlers
    const handleItemAdded = (_data: { itemId: string; wishlistId: string }) => {
      // Invalidate wishlist queries to refetch and show new item
      queryClient.invalidateQueries({
        queryKey: ["wishlist"],
      });
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
      // Remove item from cache and invalidate wishlist
      queryClient.removeQueries({
        queryKey: ["item", data.itemId],
      });
      queryClient.invalidateQueries({
        queryKey: ["wishlist"],
      });
    };

    const handleWishlistUpdated = (_data: { wishlistId: string }) => {
      // Invalidate wishlist queries to show metadata changes
      queryClient.invalidateQueries({
        queryKey: ["wishlist"],
      });
    };

    const handleClaimCreated = (data: { itemId: string; wishlistId: string; userId: string }) => {
      // Invalidate queries to show updated claim status
      queryClient.invalidateQueries({
        queryKey: ["wishlist"],
      });
      queryClient.invalidateQueries({
        queryKey: ["item", data.itemId],
      });
    };

    const handleClaimRemoved = (data: { itemId: string; wishlistId: string; userId: string }) => {
      // Invalidate queries to show removed claim status
      queryClient.invalidateQueries({
        queryKey: ["wishlist"],
      });
      queryClient.invalidateQueries({
        queryKey: ["item", data.itemId],
      });
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
  }, [wishlistId, isConnected, joinWishlist, leaveWishlist, on, off, queryClient]);
}
