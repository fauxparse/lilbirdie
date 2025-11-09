import { Gift } from "lucide-react";
import { BlurImage } from "@/components/ui/BlurImage";
import { CardBase } from "@/components/ui/CardBase";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { SerializedWishlistSummary } from "@/types/serialized";

const gridPlacements = [
  [],
  ["col-[1/-1] row-[1/-1]"],
  ["col-[1/-1] row-1", "col-[1/-1] row-2"],
  ["col-1 row-[1/-1]", "col-2 row-1", "col-2 row-2"],
  ["col-1 row-1", "col-2 row-1", "col-1 row-2", "col-2 row-2"],
] as const;

// Shared layout classes
const CARD_CONTAINER_CLASSES = "grid grid-rows-[auto_1fr] gap-3 group/list";
const IMAGE_GRID_CLASSES = "grid grid-cols-2 grid-rows-2 aspect-square gap-2";

interface WishlistCardProps {
  wishlist: SerializedWishlistSummary;
}

export function WishlistCard({ wishlist }: WishlistCardProps) {
  const items = wishlist?.items?.slice(0, 4) ?? [];

  return (
    <CardBase href={`/w/${wishlist.permalink}`} className={CARD_CONTAINER_CLASSES}>
      <div className={IMAGE_GRID_CLASSES}>
        {items.map((item, i) => (
          <div
            key={item.id}
            className={cn(
              "relative rounded-lg overflow-hidden bg-muted",
              "brightness-100 group-hover/list:brightness-110 transition-all duration-300",
              gridPlacements[items.length][i]
            )}
          >
            {item.imageUrl ? (
              <BlurImage
                src={item.imageUrl}
                blurhash={item.imageBlurhash}
                alt={item.name}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Gift className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>
      <div>
        <div className="text-lg font-medium">{wishlist.title}</div>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          {wishlist._count.items} item{wishlist._count.items !== 1 ? "s" : ""}
          <PrivacyBadge privacy={wishlist.privacy} readOnly />
        </div>
      </div>
    </CardBase>
  );
}

/**
 * WishlistCard.Skeleton - Loading skeleton that matches WishlistCard layout
 */
WishlistCard.Skeleton = function WishlistCardSkeleton() {
  return (
    <CardBase className={CARD_CONTAINER_CLASSES} asChild>
      <div>
        {/* Image grid skeleton - 2x2 grid matching the real layout */}
        <div className={IMAGE_GRID_CLASSES}>
          <Skeleton className="rounded-lg" />
          <Skeleton className="rounded-lg" />
          <Skeleton className="rounded-lg" />
          <Skeleton className="rounded-lg" />
        </div>

        {/* Text content skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </CardBase>
  );
};
