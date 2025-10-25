"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  const queryClient = useQueryClient();

  const updateItemMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Failed to update item");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["wishlist", item.wishlistId],
      });
      queryClient.invalidateQueries({
        queryKey: ["items"],
      });
      toast.success("Item updated successfully");
      onClose();
    },
    onError: (error: Error) => {
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
        onSubmit={handleSubmit}
      />
    </Modal>
  );
}
