"use client";

import { Gift, Heart, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { BlurImage } from "@/components/ui/BlurImage";
import { Button } from "@/components/ui/Button";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";
import type { DashboardData } from "@/lib/server/data-fetchers";
import { cn } from "@/lib/utils";

interface MyListsClientProps {
  initialData: DashboardData;
}

export function MyListsClient({ initialData }: MyListsClientProps) {
  const dashboardData = initialData;
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if we should open the new wishlist modal
  useEffect(() => {
    const openModal = searchParams.get("openModal");
    if (openModal === "new") {
      // Clear the query param and navigate to the modal route
      router.replace("/wishlists");
      setTimeout(() => {
        router.push("/wishlists/new");
      }, 50);
    }
  }, [searchParams, router]);

  const { wishlists } = dashboardData;

  return (
    <div className="space-y-6 @container">
      {wishlists.length === 0 ? (
        <div className="text-center py-8">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No wishlists yet</p>
          <Button asChild size="small">
            <Link href="/wishlists/new">Create Your First Wishlist</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-4 @xl:grid-cols-6 gap-8">
          {wishlists.map((wishlist) => {
            const items = wishlist?.items?.slice(0, 4) ?? [];
            return (
              <Link
                key={wishlist.id}
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
          })}
          <Link
            href="/wishlists/new"
            className="flex flex-col gap-4 items-center justify-center rounded-lg border-3 border-dashed border-border text-muted-foreground"
          >
            <Plus className="size-10 " />
            <div>Add a list</div>
          </Link>
        </div>
      )}
    </div>
  );
}

const gridPlacements = [
  [],
  ["col-[1/-1] row-[1/-1]"],
  ["col-[1/-1] row-1", "col-[1/-1] row-2"],
  ["col-1 row-[1/-1]", "col-2 row-1", "col-2 row-2"],
  ["col-1 row-1", "col-2 row-1", "col-1 row-2", "col-2 row-2"],
] as const;
