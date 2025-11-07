"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ModalDescription, ModalTitle } from "@/components/ui/Modal";
import { RouteModal } from "@/components/ui/RouteModal";
import { WishlistForm, type WishlistFormData } from "@/components/WishlistForm";
import type { DashboardData } from "@/lib/server/data-fetchers";
import type { SerializedWishlistSummary } from "@/types/serialized";

export default function NewWishlistModal() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const createWishlistMutation = useMutation({
    mutationFn: async (data: WishlistFormData): Promise<SerializedWishlistSummary> => {
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

      return response.json();
    },
    onSuccess: (newWishlist: SerializedWishlistSummary) => {
      // Update the wishlists cache by adding the new wishlist
      queryClient.setQueryData<SerializedWishlistSummary[]>(["wishlists"], (oldData) => {
        if (!oldData) return [newWishlist];
        return [...oldData, newWishlist];
      });

      // Update the dashboard cache by adding the new wishlist to the wishlists array
      queryClient.setQueryData<DashboardData>(["dashboard"], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          wishlists: [...oldData.wishlists, newWishlist],
        };
      });

      // Navigate to the new wishlist
      router.push(`/w/${newWishlist.permalink}`);
    },
  });

  const handleSubmit = (data: WishlistFormData) => {
    createWishlistMutation.mutate(data);
  };

  const handleCancel = () => {
    // Since we used router.replace() to clean the URL before opening the modal,
    // router.back() should now work correctly
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
        size="2xl"
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
      size="2xl"
    >
      <WishlistForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createWishlistMutation.isPending}
        error={createWishlistMutation.error?.message || null}
        onCancel={handleCancel}
        user={user}
      />
    </RouteModal>
  );
}
