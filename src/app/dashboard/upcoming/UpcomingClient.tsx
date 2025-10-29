"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, CheckCircle, Gift, Package, TreePine } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { DashboardData } from "@/lib/server/data-fetchers";

interface UpcomingClientProps {
  initialData: DashboardData;
}

export function UpcomingClient({ initialData }: UpcomingClientProps) {
  const queryClient = useQueryClient();

  const markAsSentMutation = useMutation({
    mutationFn: async (claimId: string) => {
      const response = await fetch(`/api/claims/${claimId}/sent`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
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

  const { upcomingGifts, claimedGifts } = initialData;
  const unsentGifts = claimedGifts.filter((gift) => !gift.sent);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 cq-lg:grid-cols-2">
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
                      <UserAvatar user={gift.friend} size="default" />
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
                    <Button variant="outline" size="small" asChild>
                      <Link href={`/u/${gift.friend.id}`}>View Profile</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Claimed Gifts to Send */}
        <Card>
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
              <div className="grid gap-4 cq-md:grid-cols-1">
                {unsentGifts.map((claimedGift) => (
                  <Card key={claimedGift.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        {claimedGift.item.imageUrl ? (
                          <img
                            src={claimedGift.item.imageUrl}
                            alt={claimedGift.item.name}
                            className="h-12 w-12 squircle object-cover"
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
                        <span>Claimed {new Date(claimedGift.createdAt).toLocaleDateString()}</span>
                      </div>
                      <Button
                        onClick={() => handleMarkAsSent(claimedGift.id)}
                        disabled={markAsSentMutation.isPending}
                        size="small"
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
    </div>
  );
}
