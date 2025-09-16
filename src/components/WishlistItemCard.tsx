"use client";
import { PriceDisplay } from "@/components/PriceDisplay";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
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
import { HandOff } from "@/icons/HandOff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sortBy, uniq, upperFirst } from "es-toolkit";
import {
  Edit,
  ExternalLink,
  Hand,
  MoreVertical,
  ShoppingCart,
  Trash,
  UserRound,
} from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import type { WishlistItemCardProps, WishlistItemResponse, WishlistResponse } from "../types";
import { useAuth } from "./AuthProvider";
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
  const { user } = useAuth();

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
    item?.currency || "NZD",
    preferredCurrency
  );

  const claims = useMemo(() => {
    return sortBy(item?.claims || [], [(c) => (c.userId === user?.id ? -1 : !c.user ? 1 : 0)]);
  }, [item?.claims, user?.id]);

  const claimNames = useMemo(() => {
    const names = uniq(
      claims.map((c) => (c.userId === user?.id ? "You" : c.user?.name || "someone else"))
    );

    if (names.length === 0) {
      return "No one";
    }

    if (names.length === 1) {
      return upperFirst(names[0]);
    }
    if (names.length === 2) {
      return upperFirst(`${names[0]} and ${names[1]}`);
    }
    return upperFirst(`${names[0]} and ${names.length - 1} other people`);
  }, [claims, user]);

  const isClaimed = claims.length > 0;

  const claimedByMe = claims.some((claim) => claim.userId === user?.id);

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
    <Card className="group grid grid-rows-[auto_1fr_auto] min-h-96 p-0 shadow-none">
      <CardHeader className="p-0 space-y-0 row-start-1 row-end-2 col-start-1 col-end-1 relative">
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-40 block object-cover rounded-t-[calc(var(--radius-lg)-1px)]"
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
                    onClick={() => onClaim(item.id, claimedByMe)}
                    disabled={isClaimPending}
                  >
                    {claimedByMe ? (
                      <>
                        <HandOff className="h-4 w-4 mr-2" />
                        Unclaim
                      </>
                    ) : (
                      <>
                        <Hand className="h-4 w-4 mr-2" />
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

      <CardContent className="row-start-2 row-span-1 col-start-1 col-span-1 space-y-3 p-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2 leading-1.2">{item.name}</CardTitle>
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
        )}
      </CardContent>
      <CardFooter className="row-start-3 row-span-1 col-start-1 col-span-1 grid grid-cols-2 grid-rows-2 gap-1 px-4 py-4 items-center">
        <div className="col-start-1 col-span-2">
          {item.url && (
            <a
              href={item.url}
              className="text-sm text-muted-foreground flex items-center gap-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ShoppingCart className="h-4 w-4" />
              {new URL(item.url).hostname}
            </a>
          )}
        </div>
        {item.price && !isCurrencyLoading && (
          <PriceDisplay
            originalPrice={Number(item.price)}
            originalCurrency={item.currency}
            convertedPrice={convertedPrice || undefined}
            convertedCurrency={convertedCurrency || undefined}
            className="font-medium text-base text-muted-foreground col-start-1 justify-self-start"
          />
        )}
        <StarInput
          value={item.priority || 0}
          onChange={setPriority}
          className="col-start-2 justify-self-end"
        />
      </CardFooter>
      {isClaimed && !isOwner && (
        <div className="row-start-1 row-span-3 col-start-1 col-span-1 relative bg-background/85 backdrop-blur-sm rounded-[calc(var(--radius-lg)-1px)] grid place-items-center p-4 animate-in fade-in-0 duration-300">
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-row-reverse justify-center">
              {[...claims].reverse().map((claim, index) => (
                <Avatar
                  key={claim.id}
                  className="h-10 w-10 bg-avatar-background shadow-[0_0_0_2px_var(--color-background)] not-last:-ml-2 animate-in slide-in-from-bottom-2 fade-in-0 duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {claim.user?.image && (
                    <AvatarImage src={claim.user.image} alt={claim.user.name || "User"} />
                  )}
                  <AvatarFallback className="text-xs">
                    {claim.user ? (
                      (claim.user.name || "?").charAt(0).toUpperCase()
                    ) : (
                      <UserRound className="h-6 w-6 text-muted-foreground" />
                    )}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div
              className="text-sm text-center text-balance animate-in slide-in-from-bottom-2 fade-in-0 duration-300"
              style={{ animationDelay: "200ms" }}
            >
              {`${claimNames} ${claims.length > 1 ? "have" : "has"} claimed this item`}
            </div>
            <div
              className="text-lg line-clamp-2 leading-1.2 font-medium animate-in slide-in-from-bottom-2 fade-in-0 duration-300"
              style={{ animationDelay: "300ms" }}
            >
              {item.name}
            </div>
            {!claimedByMe && onClaim && (
              <Button
                variant="outline"
                size="sm"
                className="w-full animate-in slide-in-from-bottom-2 fade-in-0 duration-300"
                style={{ animationDelay: "400ms" }}
                onClick={() => onClaim(item.id, claimedByMe)}
              >
                Join in
              </Button>
            )}
            {claimedByMe && (
              <Button
                variant="outline"
                size="sm"
                className="w-full animate-in slide-in-from-bottom-2 fade-in-0 duration-300"
                style={{ animationDelay: "400ms" }}
                disabled
              >
                Get sorted
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
