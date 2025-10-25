"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { WishlistForm, type WishlistFormData } from "@/components/WishlistForm";

export default function NewWishlistPage() {
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

  if (isAuthLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/wishlists">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Wishlists
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create New Wishlist</h1>
        <p className="text-gray-600 mt-2">Start collecting your favorite items in a new wishlist</p>
      </div>

      <WishlistForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createWishlistMutation.isPending}
        error={createWishlistMutation.error?.message || null}
        onCancel={() => router.push("/wishlists")}
      />
    </div>
  );
}
