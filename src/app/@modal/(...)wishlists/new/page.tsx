"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ModalDescription, ModalTitle } from "@/components/ui/Modal";
import { RouteModal } from "@/components/ui/RouteModal";
import { WishlistForm, type WishlistFormData } from "@/components/WishlistForm";

export default function NewWishlistModal() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const createWishlistMutation = useMutation({
    mutationFn: async (data: WishlistFormData): Promise<{ permalink: string }> => {
      const response = await fetch("/api/wishlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Failed to create wishlist");
      }

      return response.json() as Promise<{ permalink: string }>;
    },
    onSuccess: (wishlist: { permalink: string }) => {
      // Invalidate wishlists query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
      // Navigate to the new wishlist
      router.push(`/w/${wishlist.permalink}`);
    },
  });

  const handleSubmit = (data: WishlistFormData) => {
    createWishlistMutation.mutate(data);
  };

  const handleCancel = () => {
    router.back();
  };

  if (isAuthLoading) {
    return (
      <RouteModal
        title={<ModalTitle>Create New Wishlist</ModalTitle>}
        description={
          <ModalDescription>
            Start collecting your favorite items in a new wishlist
          </ModalDescription>
        }
      >
        <div className="py-8 text-center text-muted-foreground">Loading...</div>
      </RouteModal>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <RouteModal
      title={<ModalTitle>Create New Wishlist</ModalTitle>}
      description={
        <ModalDescription>Start collecting your favorite items in a new wishlist</ModalDescription>
      }
    >
      <WishlistForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createWishlistMutation.isPending}
        error={createWishlistMutation.error?.message || null}
        onCancel={handleCancel}
      />
    </RouteModal>
  );
}
