"use client";
import { sortBy, uniq, upperFirst } from "es-toolkit";
import {
  Edit,
  ExternalLink,
  FolderOpen,
  Hand,
  MoreVertical,
  ShoppingCart,
  Trash,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { PriceDisplay } from "@/components/PriceDisplay";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { BlurImage } from "@/components/ui/BlurImage";
import { Button } from "@/components/ui/Button";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { CardBase } from "@/components/ui/CardBase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { StarInput } from "@/components/ui/StarInput";
import { useWishlistItem, WishlistItemProvider } from "@/contexts/WishlistItemContext";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";
import { useUserPreferredCurrency } from "@/hooks/useUserPreferredCurrency";
import { HandOff } from "@/icons/HandOff";
import type { WishlistItemResponse } from "../types";
import { useAuth } from "./AuthProvider";

interface WishlistItemCardProps {
  itemId: string;
  wishlistPermalink: string;
  isOwner: boolean;
  onClaim?: (itemId: string, isClaimed: boolean) => void;
  onEdit?: (item: WishlistItemResponse) => void;
  onDelete?: (itemId: string) => void;
  onMove?: (itemId: string, itemName: string) => void;
  isClaimPending?: boolean;
  isLoading: boolean;
  refetchWishlist?: () => void;
}

function WishlistItemCardContent({
  isOwner,
  onClaim,
  onEdit,
  onDelete,
  onMove,
  isClaimPending = false,
  wishlistPermalink,
}: Omit<WishlistItemCardProps, "itemId" | "isLoading" | "refetchWishlist">) {
  const { user } = useAuth();
  const router = useRouter();

  // Get item from context
  const { item, updateItem } = useWishlistItem();

  // Helper to convert price (handles both number and Decimal-like objects)
  const getPriceAsNumber = (price: unknown): number => {
    if (!price) return 0;
    if (typeof price === "number") return price;
    if (typeof price === "object" && price !== null && "toNumber" in price) {
      return (price as { toNumber: () => number }).toNumber();
    }
    return Number(price) || 0;
  };

  const priceValue = getPriceAsNumber(item?.price);

  const { preferredCurrency, isLoading: isCurrencyLoading } = useUserPreferredCurrency();
  const { convertedPrice, convertedCurrency } = useCurrencyConversion(
    priceValue,
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

  // Early return if item data not available in cache
  if (!item) {
    return (
      <CardBase
        asChild
        isLoading
        loadingSkeleton={
          <div className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
              <div className="h-3 bg-muted rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        }
      />
    );
  }

  const setPriority = (priority: number) => {
    updateItem({
      priority,
    });
  };

  const handleCardClick = () => {
    router.push(`/w/${wishlistPermalink}/items/${item.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: Cannot use button element due to nested buttons in card
    <div
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="cursor-pointer"
    >
      <CardBase
        asChild
        className="group grid grid-rows-[auto_1fr_auto] -my-3 @md:-mx-3 gap-2 min-h-72"
      >
        <CardHeader className="p-0 space-y-0 row-start-1 row-end-2 col-start-1 col-end-1 relative">
          {item.imageUrl && (
            <BlurImage
              src={item.imageUrl}
              blurhash={item.blurhash}
              alt={item.name}
              className="w-full aspect-video rounded-lg brightness-100 group-hover:brightness-110 transition-all duration-300"
            />
          )}
          <div className="absolute top-2 right-2 z-30">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="small"
                  className="h-8 w-8 p-0 bg-background/80 rounded-full hover:bg-background/90 backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()}
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
                    {onMove && (
                      <DropdownMenuItem onClick={() => onMove(item.id, item.name)}>
                        <FolderOpen className="h-4 w-4 mr-2" />
                        Move to...
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

        <CardContent className="row-start-2 row-span-1 col-start-1 col-span-1 space-y-1 p-0">
          <CardTitle className="text-base leading-tight line-clamp-2">{item.name}</CardTitle>
          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
          )}
        </CardContent>
        <CardFooter className="row-start-3 row-span-1 col-start-1 col-span-1 grid grid-cols-2 grid-rows-2 gap-1 p-0 items-center">
          <div className="col-start-1 col-span-2">
            {item.url && (
              <a
                href={item.url}
                className="text-sm text-muted-foreground flex items-center gap-2"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <ShoppingCart className="h-4 w-4" />
                {new URL(item.url).hostname}
              </a>
            )}
          </div>
          {priceValue > 0 && (
            <PriceDisplay
              originalPrice={priceValue}
              originalCurrency={item.currency || "NZD"}
              convertedPrice={!isCurrencyLoading ? convertedPrice || undefined : undefined}
              convertedCurrency={!isCurrencyLoading ? convertedCurrency || undefined : undefined}
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
          <div className="row-start-1 row-span-3 col-start-1 col-span-1 relative z-20 bg-background/85 backdrop-blur-sm rounded-xl squircle grid place-items-center p-4 animate-in fade-in-0 duration-300">
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-row-reverse justify-center">
                {[...claims].reverse().map((claim, index) => (
                  <Avatar
                    key={claim.id}
                    className="h-10 w-10 bg-avatar-background shadow-[0_0_0_2px_var(--color-background)] not-last:-ml-2"
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
              <div className="text-sm text-center text-balance" style={{ animationDelay: "200ms" }}>
                {`${claimNames} ${claims.length > 1 || claimNames === "You" ? "have" : "has"} claimed this item`}
              </div>
              <div
                className="text-lg text-center text-balance line-clamp-2 leading-1.2 font-medium"
                style={{ animationDelay: "300ms" }}
              >
                {item.name}
              </div>
              {!claimedByMe && onClaim && (
                <Button
                  variant="outline"
                  size="small"
                  className="w-full"
                  style={{ animationDelay: "400ms" }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClaim(item.id, claimedByMe);
                  }}
                >
                  Join in
                </Button>
              )}
              {claimedByMe && (
                <Button
                  variant="outline"
                  size="small"
                  className="w-full"
                  style={{ animationDelay: "400ms" }}
                  disabled
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  Get sorted
                </Button>
              )}
            </div>
          </div>
        )}
      </CardBase>
    </div>
  );
}

export function WishlistItemCard(props: WishlistItemCardProps) {
  return (
    <WishlistItemProvider itemId={props.itemId}>
      <WishlistItemCardContent
        isOwner={props.isOwner}
        onClaim={props.onClaim}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
        onMove={props.onMove}
        isClaimPending={props.isClaimPending}
        wishlistPermalink={props.wishlistPermalink}
      />
    </WishlistItemProvider>
  );
}
