import { Gift } from "lucide-react";
import Link from "next/link";
import { BlurImage } from "@/components/ui/BlurImage";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";
import { cn } from "@/lib/utils";
import type { SerializedWishlistSummary } from "@/types/serialized";

const gridPlacements = [
  [],
  ["col-[1/-1] row-[1/-1]"],
  ["col-[1/-1] row-1", "col-[1/-1] row-2"],
  ["col-1 row-[1/-1]", "col-2 row-1", "col-2 row-2"],
  ["col-1 row-1", "col-2 row-1", "col-1 row-2", "col-2 row-2"],
] as const;

interface WishlistCardProps {
  wishlist: SerializedWishlistSummary;
}

export function WishlistCard({ wishlist }: WishlistCardProps) {
  const items = wishlist?.items?.slice(0, 4) ?? [];

  return (
    <Link
      href={`/w/${wishlist.permalink}`}
      className="grid grid-rows-[auto_1fr] gap-3 p-3 -m-3 hover:shadow-sm bg-transparent hover:bg-background-hover rounded-xl transition-all duration-300 group/list"
    >
      <div className="grid grid-cols-2 grid-rows-2 aspect-square gap-2">
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
    </Link>
  );
}
