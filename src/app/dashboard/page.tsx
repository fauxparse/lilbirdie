"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, CheckCircle, Gift, Heart, Package, TreePine, User, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { ModalDemo } from "@/components/ModalDemo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface DashboardWishlist {
  id: string;
  title: string;
  permalink: string;
  _count: {
    items: number;
  };
  isDefault: boolean;
}

interface UpcomingGift {
  friend: {
    id: string;
    name: string;
    email: string;
    image?: string;
    profile?: {
      birthday?: string;
    };
  };
  occasion: "birthday" | "christmas";
  daysUntil: number;
  date: string;
}

interface ClaimedGift {
  id: string;
  item: {
    id: string;
    name: string;
    description?: string;
    price?: number;
    imageUrl?: string;
    wishlist: {
      id: string;
      title: string;
      owner: {
        id: string;
        name: string;
        email: string;
      };
    };
  };
  createdAt: string;
  sent: boolean;
}

interface DashboardData {
  wishlists: DashboardWishlist[];
  upcomingGifts: UpcomingGift[];
  claimedGifts: ClaimedGift[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModalDemo, setShowModalDemo] = useState(false);

  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      return response.json();
    },
    enabled: !!user,
  });

  const markAsSentMutation = useMutation({
    mutationFn: async (claimId: string) => {
      const response = await fetch(`/api/claims/${claimId}/sent`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to mark as sent");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Gift marked as sent!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleMarkAsSent = (claimId: string) => {
    markAsSentMutation.mutate(claimId);
  };

  if (!user) {
    return (
      <div className="container mx-auto max-w-6xl text-center py-12">
        <h1 className="text-2xl font-bold text-muted-foreground mb-4">
          Please sign in to view your dashboard
        </h1>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl">
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <Gift className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="container mx-auto max-w-6xl text-center py-12">
        <h1 className="text-2xl font-bold text-muted-foreground mb-4">Unable to load dashboard</h1>
        <p className="text-muted-foreground mb-6">
          There was an error loading your dashboard data.
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  const { wishlists, upcomingGifts, claimedGifts } = dashboardData;
  const unsentGifts = claimedGifts.filter((gift) => !gift.sent);

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Gift className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>
          <Button
            onClick={() => setShowModalDemo(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Modal Demo
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* My Wishlists */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                My Wishlists
              </CardTitle>
            </CardHeader>
            <CardContent>
              {wishlists.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No wishlists yet</p>
                  <Button asChild size="sm">
                    <Link href="/wishlists/new">Create Your First Wishlist</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {wishlists.map((wishlist) => (
                    <div
                      key={wishlist.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/w/${wishlist.permalink}`}
                            className="font-medium hover:underline truncate block"
                          >
                            {wishlist.title}
                          </Link>
                        </div>
                        {wishlist.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {wishlist._count.items} item{wishlist._count.items !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Gift Occasions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Gift Occasions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingGifts.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No upcoming occasions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingGifts.map((gift, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {gift.friend.image ? (
                            <img
                              src={gift.friend.image}
                              alt={gift.friend.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/u/${gift.friend.id}`}
                            className="font-medium hover:underline truncate block"
                          >
                            {gift.friend.name || gift.friend.email}
                          </Link>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {gift.occasion === "christmas" ? (
                              <TreePine className="h-3 w-3" />
                            ) : (
                              <Calendar className="h-3 w-3" />
                            )}
                            <span>
                              {gift.occasion === "christmas" ? "Christmas" : "Birthday"} in{" "}
                              {gift.daysUntil} days
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/u/${gift.friend.id}`}>View Profile</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Claimed Gifts to Send */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Gifts to Send ({unsentGifts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unsentGifts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-muted-foreground">All gifts have been sent!</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {unsentGifts.map((claimedGift) => (
                    <Card key={claimedGift.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          {claimedGift.item.imageUrl ? (
                            <img
                              src={claimedGift.item.imageUrl}
                              alt={claimedGift.item.name}
                              className="h-12 w-12 rounded object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                              <Gift className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base line-clamp-2">
                              {claimedGift.item.name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              For{" "}
                              {claimedGift.item.wishlist.owner.name ||
                                claimedGift.item.wishlist.owner.email}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {claimedGift.item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {claimedGift.item.description}
                          </p>
                        )}
                        {claimedGift.item.price && (
                          <p className="text-sm font-medium">
                            ${Number(claimedGift.item.price).toFixed(2)}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Claimed {new Date(claimedGift.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <Button
                          onClick={() => handleMarkAsSent(claimedGift.id)}
                          disabled={markAsSentMutation.isPending}
                          size="sm"
                          className="w-full"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Sent
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal Demo */}
        {showModalDemo && (
          <div className="fixed inset-0 z-50 bg-background">
            <div className="relative h-full">
              <div className="absolute top-4 right-4">
                <Button onClick={() => setShowModalDemo(false)} variant="outline" size="sm">
                  ← Back to Dashboard
                </Button>
              </div>
              <ModalDemo />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
