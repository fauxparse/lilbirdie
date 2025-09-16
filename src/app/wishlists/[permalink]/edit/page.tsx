"use client";

import { useAuth } from "@/components/AuthProvider";
import { WishlistForm, type WishlistFormData } from "@/components/WishlistForm";
import { Button } from "@/components/ui/Button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

interface EditWishlistPageProps {
  params: Promise<{
    permalink: string;
  }>;
}

export default function EditWishlistPage({ params }: EditWishlistPageProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Get the permalink from params
  const { permalink } = React.use(params);

  // Fetch the current wishlist data
  const {
    data: wishlist,
    isLoading: isWishlistLoading,
    error: wishlistError,
  } = useQuery({
    queryKey: ["wishlist", permalink],
    queryFn: async () => {
      const response = await fetch(`/api/w/${permalink}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Wishlist not found");
        }
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch wishlist");
      }

      return response.json();
    },
    enabled: !!user && !!permalink,
  });

  const updateWishlistMutation = useMutation({
    mutationFn: async (data: WishlistFormData) => {
      const response = await fetch(`/api/wishlists/${permalink}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update wishlist");
      }

      return response.json();
    },
    onSuccess: (updatedWishlist) => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist", permalink] });

      toast.success("Wishlist updated successfully!");

      // Navigate back to the wishlist
      router.push(`/w/${updatedWishlist.permalink}`);
    },
  });

  const handleSubmit = (data: WishlistFormData) => {
    updateWishlistMutation.mutate(data);
  };

  if (isAuthLoading || isWishlistLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  if (wishlistError) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/wishlists">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Wishlists
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-red-600">Error</h1>
          <p className="text-gray-600 mt-2">{wishlistError.message}</p>
        </div>
      </div>
    );
  }

  if (!wishlist) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/wishlists">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Wishlists
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Wishlist Not Found</h1>
          <p className="text-gray-600 mt-2">
            The wishlist you're looking for doesn't exist or you don't have permission to edit it.
          </p>
        </div>
      </div>
    );
  }

  // Check if user owns this wishlist
  if (wishlist.owner.id !== user.id) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/w/${permalink}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Wishlist
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to edit this wishlist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/w/${permalink}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Wishlist
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Wishlist</h1>
        <p className="text-gray-600 mt-2">Update your wishlist details and privacy settings</p>
      </div>

      <WishlistForm
        mode="edit"
        initialData={{
          title: wishlist.title,
          description: wishlist.description,
          privacy: wishlist.privacy,
          isDefault: wishlist.isDefault,
        }}
        onSubmit={handleSubmit}
        isSubmitting={updateWishlistMutation.isPending}
        error={updateWishlistMutation.error?.message || null}
        onCancel={() => router.push(`/w/${permalink}`)}
      />
    </div>
  );
}
