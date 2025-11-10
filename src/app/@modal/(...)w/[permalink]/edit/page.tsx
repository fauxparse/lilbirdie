"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React from "react";
import { useAuth } from "@/components/AuthProvider";
import { ModalDescription, ModalTitle } from "@/components/ui/Modal";
import { RouteModal } from "@/components/ui/RouteModal";
import { WishlistForm, type WishlistFormData } from "@/components/WishlistForm";
import type { SerializedWishlist } from "@/types/serialized";

export default function EditWishlistModal({ params }: { params: Promise<{ permalink: string }> }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Unwrap params
  const [permalink, setPermalink] = React.useState<string | null>(null);

  React.useEffect(() => {
    params.then((p) => setPermalink(p.permalink));
  }, [params]);

  // Fetch the wishlist data
  const { data: wishlist, isLoading: isWishlistLoading } = useQuery<SerializedWishlist>({
    queryKey: ["wishlist", permalink],
    queryFn: async () => {
      const response = await fetch(`/api/wishlists/${permalink}`);
      if (!response.ok) {
        throw new Error("Failed to fetch wishlist");
      }
      return response.json();
    },
    enabled: !!permalink,
  });

  const updateWishlistMutation = useMutation({
    mutationFn: async (data: WishlistFormData): Promise<SerializedWishlist> => {
      if (!wishlist?.id) {
        throw new Error("Wishlist ID not available");
      }

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

      return response.json();
    },
    onSuccess: (updatedWishlist: SerializedWishlist) => {
      // Update the wishlist cache
      queryClient.setQueryData<SerializedWishlist>(["wishlist", permalink], updatedWishlist);

      // Invalidate dashboard cache to reflect changes
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      // Navigate back
      router.back();
    },
  });

  const handleSubmit = (data: WishlistFormData) => {
    updateWishlistMutation.mutate(data);
  };

  const handleCancel = () => {
    router.back();
  };

  if (isAuthLoading || isWishlistLoading || !permalink) {
    return (
      <RouteModal
        title={<ModalTitle>Edit Wishlist</ModalTitle>}
        description={<ModalDescription>Update your wishlist details</ModalDescription>}
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

  if (!wishlist) {
    router.back();
    return null;
  }

  // Transform wishlist data for the form
  const initialData: Partial<WishlistFormData> = {
    title: wishlist.title,
    description: wishlist.description || undefined,
    privacy: wishlist.privacy,
    isDefault: wishlist.isDefault,
    occasions: wishlist.occasions?.map((occasion) => ({
      id: occasion.id,
      type: occasion.type,
      date: occasion.date || undefined,
      title: occasion.title || undefined,
      isRecurring: occasion.isRecurring,
      startYear: occasion.startYear || undefined,
    })),
  };

  return (
    <RouteModal
      title={<ModalTitle>Edit Wishlist</ModalTitle>}
      description={<ModalDescription>Update your wishlist details</ModalDescription>}
      size="2xl"
    >
      <WishlistForm
        mode="edit"
        initialData={initialData}
        onSubmit={handleSubmit}
        isSubmitting={updateWishlistMutation.isPending}
        error={updateWishlistMutation.error?.message || null}
        onCancel={handleCancel}
        user={user}
      />
    </RouteModal>
  );
}
