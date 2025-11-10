"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWishlist } from "@/contexts/WishlistContext";
import type { WishlistItemResponse } from "@/types";
import { ItemForm, type ItemFormData } from "./AddItemModal/ItemForm";
import { Modal, ModalHeader, ModalTitle } from "./ui/Modal";

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    name: string;
    description?: string | null;
    url?: string | null;
    imageUrl?: string | null;
    price?: number | null;
    currency?: string | null;
    priority?: number | null;
    wishlistId: string;
  };
}

export function EditItemModal({ isOpen, onClose, item }: EditItemModalProps) {
  const { updateItemCache, getItem } = useWishlist();

  const updateItemMutation = useMutation({
    mutationFn: async (data: ItemFormData): Promise<WishlistItemResponse> => {
      const response = await fetch(`/api/items/${item.id}`, {
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

      return response.json() as Promise<WishlistItemResponse>;
    },
    onMutate: async (data) => {
      // Get the current item from cache
      const currentItem = getItem(item.id);

      if (currentItem) {
        // Optimistically update cache with new values
        updateItemCache({
          ...currentItem,
          ...data,
        });
      }

      // Return snapshot for potential rollback
      return { previousItem: currentItem };
    },
    onSuccess: (updatedItem) => {
      // Update cache with actual server response
      updateItemCache(updatedItem);
      toast.success("Item updated successfully");
      onClose();
    },
    onError: (error: Error, _variables, context) => {
      // Rollback on error
      if (context?.previousItem) {
        updateItemCache(context.previousItem);
      }
      toast.error(error.message || "Failed to update item");
    },
  });

  const handleSubmit = (data: ItemFormData) => {
    updateItemMutation.mutate(data);
  };

  const initialData: ItemFormData = {
    name: item.name,
    description: item.description || undefined,
    url: item.url || undefined,
    imageUrl: item.imageUrl || undefined,
    price: item.price || undefined,
    currency: (item.currency as ItemFormData["currency"]) || undefined,
    priority: item.priority || undefined,
    tags: [], // TODO: Add tags support when available
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <ModalHeader>
        <ModalTitle>Edit Item</ModalTitle>
      </ModalHeader>
      <ItemForm
        initialData={initialData}
        busy={updateItemMutation.isPending}
        onCancel={onClose}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
}
