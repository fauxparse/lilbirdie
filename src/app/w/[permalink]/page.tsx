"use client";

import { useAuth } from "@/components/AuthProvider";
import { WishlistItemCard } from "@/components/WishlistItemCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";
import { toast } from "sonner";

interface WishlistItem {
  id: string;
  name: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  price?: number | string;
  currency: string;
  priority: number;
  claims?: Array<{
    userId: string;
    createdAt: string;
  }>;
}

interface PublicWishlist {
  id: string;
  title: string;
  description?: string;
  permalink: string;
  privacy: string;
  owner: {
    id: string;
    name?: string;
    email: string;
    image?: string;
  };
  items: WishlistItem[];
  _count: {
    items: number;
  };
}

export default function PublicWishlistPage({
  params,
}: {
  params: Promise<{ permalink: string }>;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { permalink } = React.use(params);

  const {
    data: wishlist,
    isLoading,
    error,
  } = useQuery<PublicWishlist>({
    queryKey: ["public-wishlist", permalink],
    queryFn: async () => {
      const response = await fetch(`/api/w/${permalink}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("NOT_FOUND");
        }
        throw new Error("Failed to fetch wishlist");
      }
      return response.json();
    },
  });

  const claimMutation = useMutation({
    mutationFn: async ({ itemId, action }: { itemId: string; action: "claim" | "unclaim" }) => {
      const method = action === "claim" ? "POST" : "DELETE";
      const response = await fetch(`/api/w/${permalink}/items/${itemId}/claim`, {
        method,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update claim");
      }

      return response.json();
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["public-wishlist", permalink] });
      toast.success(action === "claim" ? "Item claimed!" : "Item unclaimed!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleClaim = (itemId: string, isClaimed: boolean) => {
    if (!user) {
      toast.error("Please sign in to claim items");
      return;
    }

    claimMutation.mutate({
      itemId,
      action: isClaimed ? "unclaim" : "claim",
    });
  };

  if (error?.message === "NOT_FOUND") {
    notFound();
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !wishlist) {
    return (
      <div className="container mx-auto max-w-4xl text-center">
        <div className="py-12">
          <h1 className="text-2xl font-bold text-muted-foreground mb-4">Unable to load wishlist</h1>
          <p className="text-muted-foreground mb-6">
            There was an error loading this wishlist. It may not exist or may be private.
          </p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === wishlist.owner.id;

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{wishlist.title}</h1>
            {wishlist.description && (
              <p className="text-muted-foreground mt-2">{wishlist.description}</p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-2">
                {wishlist.owner.image ? (
                  <img
                    src={wishlist.owner.image}
                    alt={wishlist.owner.name || "Owner"}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  by {wishlist.owner.name || wishlist.owner.email}
                </span>
              </div>
              <Badge variant="outline" className="ml-2">
                {wishlist.privacy === "PUBLIC"
                  ? "Public"
                  : wishlist.privacy === "FRIENDS_ONLY"
                    ? "Friends Only"
                    : "Private"}
              </Badge>
            </div>
          </div>

          {isOwner && (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/wishlists/${wishlist.permalink}/edit` as any}>Edit Wishlist</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/wishlists">My Wishlists</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Items */}
        {wishlist.items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No items yet</h3>
              <p className="text-muted-foreground">
                This wishlist is empty.
                {isOwner && " Add some items to get started!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {wishlist.items.map((item) => (
              <WishlistItemCard
                key={item.id}
                item={item}
                isOwner={isOwner}
                onClaim={handleClaim}
                isClaimPending={claimMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
