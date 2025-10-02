"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";

interface UndoableDeleteOptions {
  type: "item" | "wishlist";
  id: string;
  name: string;
  onUndo?: () => void;
  undoTimeout?: number; // in milliseconds
}


export function useUndoableDelete() {
  const queryClient = useQueryClient();

  const restoreItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/items/${itemId}/restore`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to restore item");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
    },
  });

  const restoreWishlistMutation = useMutation({
    mutationFn: async (wishlistId: string) => {
      const response = await fetch(`/api/wishlists/${wishlistId}/restore`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to restore wishlist");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
    },
  });

  const performUndoableDelete = useCallback(
    async (options: UndoableDeleteOptions) => {
      const {
        type,
        id,
        name,
        onUndo,
        undoTimeout = 5000, // Default 5 second timeout
      } = options;

      let toastId: string | number | undefined;

      const handleUndo = async () => {
        try {
          if (type === "item") {
            await restoreItemMutation.mutateAsync(id);
          } else if (type === "wishlist") {
            await restoreWishlistMutation.mutateAsync(id);
          }

          if (toastId) {
            toast.dismiss(toastId);
          }

          toast.success(`Restored "${name}"`);
          onUndo?.();
        } catch (error) {
          console.error("Failed to restore:", error);
          toast.error(`Failed to restore "${name}"`);
        }
      };

      // Show undo toast
      toastId = toast(`Deleted "${name}"`, {
        duration: undoTimeout,
        action: {
          label: "Undo",
          onClick: handleUndo,
        },
        onDismiss: () => {
          // Toast was dismissed, no longer allow undo
          toastId = undefined;
        },
      });

      return toastId;
    },
    [restoreItemMutation, restoreWishlistMutation]
  );

  return {
    performUndoableDelete,
    isRestoring: restoreItemMutation.isPending || restoreWishlistMutation.isPending,
  };
}
