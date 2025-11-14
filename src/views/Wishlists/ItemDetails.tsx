"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Edit, ExternalLink, Hand, ShoppingCart, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { PriceDisplay } from "@/components/PriceDisplay";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { BlurImage } from "@/components/ui/BlurImage";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import { StarInput } from "@/components/ui/StarInput";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";
import { useUserPreferredCurrency } from "@/hooks/useUserPreferredCurrency";
import { HandOff } from "@/icons/HandOff";
import type { WishlistItemResponse } from "@/types";

interface ItemDetailsProps {
  item: WishlistItemResponse;
  permalink: string;
}

export function ItemDetails({ item, permalink }: ItemDetailsProps) {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isOwner = item.wishlist?.owner?.id === user?.id;

  // Helper to convert price (handles both number and Decimal-like objects)
  const getPriceAsNumber = (price: unknown): number => {
    if (!price) return 0;
    if (typeof price === "number") return price;
    if (typeof price === "object" && price !== null && "toNumber" in price) {
      return (price as { toNumber: () => number }).toNumber();
    }
    return Number(price) || 0;
  };

  const priceValue = getPriceAsNumber(item.price);

  const { preferredCurrency, isLoading: isCurrencyLoading } = useUserPreferredCurrency();
  const { convertedPrice, convertedCurrency } = useCurrencyConversion(
    priceValue,
    item.currency || "NZD",
    preferredCurrency
  );

  const claimedByMe = item.claims?.some((claim) => claim.userId === user?.id);
  const isClaimed = (item.claims?.length || 0) > 0;

  // Claim/Unclaim mutation
  const claimMutation = useMutation({
    mutationFn: async (action: "claim" | "unclaim") => {
      const response = await fetch(`/api/items/${item.id}/claim`, {
        method: action === "claim" ? "POST" : "DELETE",
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || `Failed to ${action} item`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Refetch the item to get updated claims
      queryClient.invalidateQueries({ queryKey: ["item", item.id] });
      queryClient.invalidateQueries({ queryKey: ["wishlist", permalink] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Failed to delete item");
      }

      return response.json();
    },
    onSuccess: () => {
      // Navigate back and invalidate wishlist query
      queryClient.invalidateQueries({ queryKey: ["wishlist", permalink] });
      router.back();
    },
  });

  const handleClaim = () => {
    claimMutation.mutate(claimedByMe ? "unclaim" : "claim");
  };

  const handleEdit = () => {
    // Close modal and navigate to edit (will be handled by existing edit modal)
    router.push(`/w/${permalink}/edit#item=${item.id}`);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="flex flex-col">
      {/* Two-column layout on medium+ screens */}
      <div className="p-6 md:grid md:grid-cols-[300px_1fr] md:gap-6">
        {/* Left Column - Image and Price */}
        <div className="space-y-4 mb-6 md:mb-0">
          {item.imageUrl && (
            <BlurImage
              src={item.imageUrl}
              blurhash={item.blurhash}
              alt={item.name}
              className="w-full aspect-square rounded-lg object-cover"
            />
          )}
          {priceValue > 0 && (
            <div>
              <PriceDisplay
                originalPrice={priceValue}
                originalCurrency={item.currency || "NZD"}
                convertedPrice={!isCurrencyLoading ? convertedPrice || undefined : undefined}
                convertedCurrency={!isCurrencyLoading ? convertedCurrency || undefined : undefined}
                className="text-xl font-semibold"
              />
            </div>
          )}
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
        {/* Priority */}
        {isOwner && (
          <div>
            <StarInput
              value={item.priority || 0}
              onChange={() => {}}
              disabled
              className="pointer-events-none"
            />
          </div>
        )}

          {/* Description */}
          {item.description && (
            <div className="text-base text-muted-foreground">{item.description}</div>
          )}

          {/* URL */}
          {item.url && (
            <div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>View on {new URL(item.url).hostname}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Claims Section (for non-owners) */}
          {!isOwner && isClaimed && item.claims && item.claims.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {item.claims.length === 1 ? "Claimed by" : "Claimed by"}
                </h3>
                <div className="space-y-3">
                  {item.claims.map((claim) => (
                    <div key={claim.id} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        {claim.user?.image && (
                          <AvatarImage src={claim.user.image} alt={claim.user.name || "User"} />
                        )}
                        <AvatarFallback>
                          {claim.user?.name ? claim.user.name.charAt(0).toUpperCase() : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">
                          {claim.userId === user?.id ? "You" : claim.user?.name || "Someone"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Wishlist Owner Info (for non-owners) */}
          {!isOwner && item.wishlist?.owner && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  From{" "}
                  <Link
                    href={`/w/${permalink}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {item.wishlist.title}
                  </Link>
                  {" by "}
                  <span className="font-medium text-foreground">
                    {item.wishlist.owner.name || "Unknown"}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t p-6 flex gap-3">
        {isOwner ? (
          <>
            <Button
              onClick={handleEdit}
              variant="outline"
              className="flex-1"
              disabled={deleteMutation.isPending}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={handleDelete}
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </>
        ) : (
          <Button
            onClick={handleClaim}
            variant={claimedByMe ? "outline" : "default"}
            className="flex-1"
            size="large"
            disabled={claimMutation.isPending}
          >
            {claimMutation.isPending ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                {claimedByMe ? "Unclaiming..." : "Claiming..."}
              </>
            ) : claimedByMe ? (
              <>
                <HandOff className="h-5 w-5 mr-2" />
                Unclaim this item
              </>
            ) : (
              <>
                <Hand className="h-5 w-5 mr-2" />
                Claim this item
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
