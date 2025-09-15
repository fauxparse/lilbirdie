"use client";
import { PriceDisplay } from "@/components/PriceDisplay";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { StarInput } from "@/components/ui/StarInput";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";
import { useUserPreferredCurrency } from "@/hooks/useUserPreferredCurrency";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, ExternalLink, Gift, Heart, MoreVertical, Trash } from "lucide-react";
import { toast } from "sonner";
import type { WishlistItemCardProps, WishlistItemResponse, WishlistResponse } from "../types";
import { ItemFormData } from "./ItemForm";

export function WishlistItemCard({
  itemId,
  wishlistPermalink,
  isOwner,
  onClaim,
  onEdit,
  onDelete,
  isClaimPending = false,
}: WishlistItemCardProps) {
  const queryClient = useQueryClient();
  // Individual item query - will use cached data if available
  const itemQuery = useQuery<WishlistItemResponse>({
    queryKey: ["item", itemId],
    queryFn: async (): Promise<WishlistItemResponse> => {
      const response = await fetch(`/api/items/${itemId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch item");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  const item = itemQuery.data;

  const { preferredCurrency, isLoading: isCurrencyLoading } = useUserPreferredCurrency();
  const { convertedPrice, convertedCurrency } = useCurrencyConversion(
    Number(item?.price) || 0,
    item?.currency || "USD",
    preferredCurrency
  );

  const isClaimed = (item?.claims?.length || 0) > 0;

  const updateItemMutation = useMutation<WishlistItemResponse, Error, Partial<ItemFormData>>({
    mutationFn: async (data: Partial<ItemFormData>): Promise<WishlistItemResponse> => {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add item");
      }

      return response.json();
    },
    onSuccess: (updatedItem: WishlistItemResponse) => {
      // Update individual item cache
      queryClient.setQueryData(["item", updatedItem.id], updatedItem);

      // Update wishlist cache
      queryClient.setQueryData<WishlistResponse>(
        ["public-wishlist", wishlistPermalink],
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            items: oldData.items.map((existingItem) =>
              existingItem.id === updatedItem.id ? updatedItem : existingItem
            ),
          };
        }
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Handle loading and error states
  if (itemQuery.isLoading) {
    return (
      <Card className="group">
        <CardHeader className="pb-3">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-6 bg-gray-200 rounded w-full mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (itemQuery.isError || !item) {
    return (
      <Card className="group">
        <CardContent className="p-6">
          <p className="text-red-500 text-center">Failed to load item</p>
        </CardContent>
      </Card>
    );
  }

  const setPriority = (priority: number) => {
    updateItemMutation.mutate({
      priority,
    });
  };

  return (
    <Card className="group item-card grid p-0 shadow-none">
      <CardHeader className="p-0 space-y-0 grid-area-header relative">
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-40 block object-cover rounded-t-md"
          />
        )}
        {/* Kebab menu in top right */}
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0 bg-background/80 rounded-full hover:bg-background/90 backdrop-blur-sm"
              >
                <MoreVertical className="h-4 w-4 text-foreground" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {item.url && (
                <DropdownMenuItem asChild>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View
                  </a>
                </DropdownMenuItem>
              )}
              {isOwner ? (
                <>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(item.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </>
              ) : (
                onClaim && (
                  <DropdownMenuItem
                    onClick={() => onClaim(item.id, isClaimed)}
                    disabled={isClaimPending}
                  >
                    {isClaimed ? (
                      <>
                        <Heart className="h-4 w-4 mr-2 fill-current" />
                        Unclaim
                      </>
                    ) : (
                      <>
                        <Gift className="h-4 w-4 mr-2" />
                        Claim
                      </>
                    )}
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="grid-area-text space-y-3 p-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2 leading-1.2">
            {item.url ? (
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {item.name}
              </a>
            ) : (
              item.name
            )}
          </CardTitle>
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
        )}

        {isClaimed && (
          <p className="text-xs text-muted-foreground">
            Claimed by {item.claims?.length || 0} person
            {(item.claims?.length || 0) > 1 ? "s" : ""}
          </p>
        )}
      </CardContent>
      <CardFooter className="grid-area-footer grid grid-cols-2 grid-rows-1 px-4 py-4 items-end">
        {item.price && !isCurrencyLoading && (
          <PriceDisplay
            originalPrice={Number(item.price)}
            originalCurrency={item.currency}
            convertedPrice={convertedPrice || undefined}
            convertedCurrency={convertedCurrency || undefined}
            className="font-medium text-base col-start-1 row-start-1"
          />
        )}
        <StarInput
          value={item.priority || 0}
          onChange={setPriority}
          className="col-start-2 row-start-1 justify-self-end"
        />
      </CardFooter>
    </Card>
  );
}
