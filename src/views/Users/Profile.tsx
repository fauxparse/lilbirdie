"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ProfileHeader } from "@/components/ui/ProfileHeader";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { WishlistCard } from "@/components/WishlistCard";
import type { UserProfileData } from "@/lib/server/data-fetchers";

interface ProfileProps {
  userId: string;
  initialData: UserProfileData | null;
}

export function Profile({ userId, initialData }: ProfileProps) {
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery<UserProfileData>({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("NOT_FOUND");
        }
        throw new Error("Failed to fetch user profile");
      }
      return response.json();
    },
    initialData: initialData || undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (error?.message === "NOT_FOUND") {
    notFound();
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 container-type-inline-size">
        <div className="space-y-6">
          {/* Header Skeleton - matches ProfileHeader structure */}

          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 bg-muted rounded-full animate-pulse" />
            <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          </div>
          <div className="border-t border-border" />

          {/* Wishlists Skeleton */}
          <div className="space-y-6 @container">
            <ResponsiveGrid>
              {Array.from({ length: 4 }).map((_, i) => (
                <WishlistCard.Skeleton key={i} />
              ))}
            </ResponsiveGrid>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8 container-type-inline-size text-center">
        <div className="py-12">
          <h1 className="text-2xl font-bold text-muted-foreground mb-4">Unable to load profile</h1>
          <p className="text-muted-foreground mb-6">
            There was an error loading this user profile.
          </p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 container-type-inline-size">
      {/* User Header */}
      <ProfileHeader profile={profile}>
        <div className="border-b border-border p-4 flex justify-center items-center"></div>
      </ProfileHeader>

      {/* Wishlists Section */}
      <div className="@container mt-8">
        {profile.wishlists.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              {profile.isOwnProfile ? "No wishlists yet" : "No public wishlists"}
            </p>
            {profile.isOwnProfile && (
              <Button asChild size="small">
                <Link href="/wishlists/new">Create Your First Wishlist</Link>
              </Button>
            )}
          </div>
        ) : (
          <ResponsiveGrid>
            {profile.wishlists.map((wishlist) => (
              <WishlistCard key={wishlist.id} wishlist={wishlist} />
            ))}
          </ResponsiveGrid>
        )}
      </div>
    </div>
  );
}
