"use client";

import { Calendar } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { ProfileCard } from "@/components/ui/ProfileCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { OCCASIONS } from "@/lib/occasions";
import type { DashboardData } from "@/lib/server/data-fetchers";

interface UpcomingProps {
  initialData: DashboardData;
}

export function Upcoming({ initialData }: UpcomingProps) {
  // const queryClient = useQueryClient();

  // const markAsSentMutation = useMutation({
  //   mutationFn: async (claimId: string) => {
  //     const response = await fetch(`/api/claims/${claimId}/sent`, {
  //       method: "POST",
  //     });

  //     if (!response.ok) {
  //       const error = (await response.json()) as { error?: string };
  //       throw new Error(error.error || "Failed to mark as sent");
  //     }

  //     return response.json();
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  //     toast.success("Gift marked as sent!");
  //   },
  //   onError: (error) => {
  //     toast.error(error.message);
  //   },
  // });

  // const handleMarkAsSent = (claimId: string) => {
  //   markAsSentMutation.mutate(claimId);
  // };

  const { upcomingOccasions } = initialData;
  // const unsentGifts = claimedGifts.filter((gift) => !gift.sent);

  return (
    <div className="@container space-y-6">
      <div>
        {/* Upcoming Occasions */}
        <div className="space-y-3 grid grid-cols-1 @2xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4 gap-4">
          {upcomingOccasions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No upcoming occasions</p>
            </div>
          ) : (
            upcomingOccasions.map((occasion, index) => {
              const OccasionIcon = OCCASIONS[occasion.occasionType].icon;

              const card = (
                <ProfileCard
                  key={index}
                  avatar={<UserAvatar user={occasion.friend} />}
                  primaryText={
                    <p className="font-medium truncate">
                      {occasion.friend.name || occasion.friend.email}
                    </p>
                  }
                  secondaryText={
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <OccasionIcon className="h-3 w-3" />
                      <span>
                        {occasion.occasionTitle} in {occasion.daysUntil} days
                      </span>
                    </div>
                  }
                />
              );

              // Only wrap in Link if there's a wishlist to link to
              return occasion.wishlistPermalink ? (
                <Link key={index} href={`/w/${occasion.wishlistPermalink}` as Route}>
                  {card}
                </Link>
              ) : (
                card
              );
            })
          )}
        </div>

        {/* Claimed Gifts to Send */}
        {/* <Card>
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
                        <span>
                          Claimed{" "}
                          {new Date(claimedGift.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })}
                        </span>
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
        </Card> */}
      </div>
    </div>
  );
}
