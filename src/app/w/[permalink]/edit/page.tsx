"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import type { WishlistFormData } from "@/components/WishlistForm";
import { WishlistForm } from "@/components/WishlistForm";

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

  // Fetch the current wishlist data and its occasions
  const {
    data: wishlist,
    isLoading: isWishlistLoading,
    error: wishlistError,
  } = useQuery({
    queryKey: ["wishlist", permalink, "with-occasions"],
    queryFn: async (): Promise<{
      id: string;
      owner: { id: string };
      title: string;
      description?: string;
      privacy: "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";
      isDefault?: boolean;
      occasions?: Array<{
        id: string;
        title: string;
        date: string;
        type: string;
        isRecurring: boolean;
        startYear?: number;
      }>;
    }> => {
      const response = await fetch(`/api/w/${permalink}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Wishlist not found");
        }
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Failed to fetch wishlist");
      }

      const wishlistData = (await response.json()) as {
        id: string;
        owner: { id: string };
        title: string;
        description?: string;
        privacy: "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";
        isDefault?: boolean;
      };

      // Fetch associated occasions
      try {
        const occasionResponse = await fetch(`/api/occasions`);
        if (occasionResponse.ok) {
          const allOccasions = (await occasionResponse.json()) as Array<{
            id: string;
            title: string;
            date: string;
            type: string;
            isRecurring: boolean;
            startYear?: number;
            entityType?: string;
            entityId?: string;
          }>;

          // Filter occasions for this wishlist
          const wishlistOccasions = allOccasions.filter(
            (o) => o.entityType === "WISHLIST" && o.entityId === wishlistData.id
          );

          return {
            ...wishlistData,
            occasions: wishlistOccasions.map((o) => ({
              id: o.id,
              title: o.title,
              date: o.date,
              type: o.type,
              isRecurring: o.isRecurring,
              startYear: o.startYear,
            })),
          };
        }
      } catch (occasionError) {
        console.error("Error fetching occasions:", occasionError);
      }

      return wishlistData;
    },
    enabled: !!user && !!permalink,
  });

  const updateWishlistMutation = useMutation({
    mutationFn: async (data: WishlistFormData): Promise<{ permalink: string }> => {
      const response = await fetch(`/api/wishlists/${permalink}`, {
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

      return response.json() as Promise<{ permalink: string }>;
    },
    onSuccess: (updatedWishlist: { permalink: string }) => {
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
          occasions: wishlist.occasions
            ? wishlist.occasions.map((occasion) => ({
                id: occasion.id,
                type: occasion.type as
                  | "BIRTHDAY"
                  | "CHRISTMAS"
                  | "VALENTINES_DAY"
                  | "ANNIVERSARY"
                  | "GRADUATION"
                  | "WEDDING"
                  | "CUSTOM",
                date: occasion.date.split("T")[0],
                title: occasion.title,
                isRecurring: occasion.isRecurring,
                startYear: occasion.startYear,
              }))
            : undefined,
        }}
        onSubmit={handleSubmit}
        isSubmitting={updateWishlistMutation.isPending}
        error={updateWishlistMutation.error?.message || null}
        onCancel={() => router.push(`/w/${permalink}`)}
        user={user}
      />
    </div>
  );
}
