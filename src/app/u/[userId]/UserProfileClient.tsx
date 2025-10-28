"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  Gift,
  Heart,
  MoreVertical,
  User,
  UserCheck,
  UserMinus,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import type { UserProfileData } from "@/lib/server/data-fetchers";

interface UserProfileClientProps {
  userId: string;
  initialData: UserProfileData | null;
}

export function UserProfileClient({ userId, initialData }: UserProfileClientProps) {
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery<UserProfileData>({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      const response = await fetch(`/api/u/${userId}`);
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

  const friendshipMutation = useMutation({
    mutationFn: async (action: "add" | "remove") => {
      const method = action === "add" ? "POST" : "DELETE";
      const response = await fetch(`/api/u/${userId}/friendship`, {
        method,
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Failed to update friendship");
      }

      return response.json();
    },
    onSuccess: (_data, action) => {
      queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
      toast.success(action === "add" ? "Friend request sent!" : "Friend removed");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFriendshipAction = (action: "add" | "remove") => {
    friendshipMutation.mutate(action);
  };

  if (error?.message === "NOT_FOUND") {
    notFound();
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl container-type-inline-size">
        <div className="space-y-6">
          <div className="flex items-center gap-4 animate-pulse">
            <div className="h-20 w-20 bg-muted rounded-full" />
            <div>
              <div className="h-6 bg-muted rounded w-32 mb-2" />
              <div className="h-4 bg-muted rounded w-48" />
            </div>
          </div>
          <div className="grid gap-4 cq-md:grid-cols-2 cq-lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto max-w-4xl text-center">
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

  const getFriendshipButton = () => {
    if (profile.isOwnProfile) {
      return null;
    }

    switch (profile.friendshipStatus) {
      case "friends":
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <UserCheck className="h-4 w-4" />
                Friends
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => handleFriendshipAction("remove")}
                className="text-destructive focus:text-destructive"
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Remove Friend
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );

      case "pending_sent":
        return (
          <Button variant="outline" disabled className="gap-2">
            <Clock className="h-4 w-4" />
            Request Sent
          </Button>
        );

      case "pending_received":
        return (
          <Button variant="outline" disabled className="gap-2">
            <Clock className="h-4 w-4" />
            Request Received
          </Button>
        );

      default:
        return (
          <Button
            onClick={() => handleFriendshipAction("add")}
            disabled={friendshipMutation.isPending}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add Friend
          </Button>
        );
    }
  };

  const getPrivacyBadgeVariant = (privacy: string) => {
    switch (privacy) {
      case "PUBLIC":
        return "default";
      case "FRIENDS_ONLY":
        return "secondary";
      case "PRIVATE":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto max-w-4xl container-type-inline-size">
      <div className="space-y-6">
        {/* User Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {profile.user.image ? (
                <img
                  src={profile.user.image}
                  alt={profile.user.name || "User"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profile.user.name || profile.user.email}</h1>
              <p className="text-muted-foreground">
                {profile.user.name ? profile.user.email : "User Profile"}
              </p>
              {profile.user.profile?.birthday && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  Birthday: {new Date(profile.user.profile.birthday).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">{getFriendshipButton()}</div>
        </div>

        {/* Wishlists */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {profile.isOwnProfile ? "Your Wishlists" : "Public Wishlists"}
          </h2>

          {profile.wishlists.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {profile.isOwnProfile ? "No wishlists yet" : "No public wishlists"}
                </h3>
                <p className="text-muted-foreground">
                  {profile.isOwnProfile
                    ? "Create your first wishlist to get started!"
                    : "This user hasn't shared any public wishlists yet."}
                </p>
                {profile.isOwnProfile && (
                  <Button asChild className="mt-4">
                    <Link href="/wishlists/new">Create Wishlist</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 cq-md:grid-cols-2 cq-lg:grid-cols-3">
              {profile.wishlists.map((wishlist) => (
                <Card key={wishlist.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2">
                        <Link href={`/w/${wishlist.permalink}`} className="hover:underline">
                          {wishlist.title}
                        </Link>
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={getPrivacyBadgeVariant(wishlist.privacy)}
                          className="text-xs"
                        >
                          {wishlist.privacy === "PUBLIC"
                            ? "Public"
                            : wishlist.privacy === "FRIENDS_ONLY"
                              ? "Friends"
                              : "Private"}
                        </Badge>
                        {wishlist.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            <Heart className="h-3 w-3 mr-1 fill-current" />
                            Default
                          </Badge>
                        )}
                      </div>
                    </div>
                    {wishlist.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {wishlist.description}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {wishlist._count.items} item{wishlist._count.items !== 1 ? "s" : ""}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(wishlist.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <Button variant="outline" size="small" asChild className="w-full">
                      <Link href={`/w/${wishlist.permalink}`}>
                        <Gift className="h-4 w-4 mr-2" />
                        View Wishlist
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
