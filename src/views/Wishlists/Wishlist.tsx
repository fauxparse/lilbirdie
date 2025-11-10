"use client";

import { useMutation } from "@tanstack/react-query";
import { Gift, Plus } from "lucide-react";
import Link from "next/link";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AddItemModal } from "@/components/AddItemModal";
import { useAuth } from "@/components/AuthProvider";
import { EditItemModal } from "@/components/EditItemModal";
import { MoveItemsModal } from "@/components/MoveItemsModal";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { InlineEditable } from "@/components/ui/InlineEditable";
import { OccasionBadge } from "@/components/ui/OccasionBadge";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";
import { ProfileHeader } from "@/components/ui/ProfileHeader";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { WishlistItemCard } from "@/components/WishlistItemCard";
import { useWishlist, WishlistProvider } from "@/contexts/WishlistContext";
import { useUndoableDelete } from "@/hooks/useUndoableDelete";
import type { UserProfileData } from "@/lib/server/data-fetchers";
import type { WishlistItemWithRelations } from "@/types";
import type { SerializedWishlist } from "@/types/serialized";
import { FilterBar } from "./FilterBar";

interface WishlistProps {
  permalink: string;
  initialData: SerializedWishlist | null;
}

export const Wishlist: React.FC<WishlistProps> = ({ permalink, initialData }) => (
  <WishlistProvider permalink={permalink} initialData={initialData}>
    <WishlistInner />
  </WishlistProvider>
);

const WishlistInner: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasOpenedModalRef = useRef(false);
  const {
    wishlist,
    isLoading,
    isOwner,
    friendshipStatus,
    error,
    refetch,
    claimMutation,
    removeItemFromCache,
    updateWishlist,
    processedItems,
  } = useWishlist();

  // Undoable delete hook
  const { performUndoableDelete } = useUndoableDelete();

  // Item management state
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItemWithRelations | null>(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [itemsToMove, setItemsToMove] = useState<{ ids: string[]; names: string[] }>({
    ids: [],
    names: [],
  });

  // Check if we should open the edit wishlist modal (only once)
  useEffect(() => {
    const openModal = searchParams.get("openModal");
    if (openModal === "edit" && !hasOpenedModalRef.current && wishlist?.permalink) {
      hasOpenedModalRef.current = true;
      // First, clear the query param from the URL
      // Use window.history.replaceState for immediate effect
      window.history.replaceState({}, "", `/w/${wishlist.permalink}`);
      // Then navigate to the modal route
      setTimeout(() => {
        router.push(`/w/${wishlist.permalink}/edit`);
      }, 10);
    }
  }, [searchParams, router, wishlist?.permalink]);

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string): Promise<{ name?: string }> => {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Failed to delete item");
      }

      return response.json() as Promise<{ name?: string }>;
    },
    onSuccess: (deletedItem: { name?: string }, itemId) => {
      // Remove item from cache immediately
      removeItemFromCache(itemId);

      // Show undoable delete toast
      performUndoableDelete({
        type: "item",
        id: itemId,
        name: deletedItem.name || "Item",
        onUndo: () => {
          // Refresh the wishlist to show the restored item
          refetch();
        },
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDeleteItem = (itemId: string) => {
    // Direct delete with undo functionality
    deleteItemMutation.mutate(itemId);
  };

  const handleMoveItem = (itemId: string, itemName: string) => {
    setItemsToMove({
      ids: [itemId],
      names: [itemName],
    });
    setMoveModalOpen(true);
  };

  const handleClaim = (itemId: string, isClaimed: boolean) => {
    if (!user) {
      toast.error("Please sign in to claim items");
      return;
    }

    claimMutation.mutate({
      itemId,
      action: isClaimed ? "unclaim" : "claim",
    });
  };

  if (error?.message === "NOT_FOUND") {
    notFound();
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 container-type-inline-size">
        <div className="space-y-6 @container">
          {/* Profile Header Skeleton */}
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 bg-muted rounded-full animate-pulse" />
            <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          </div>

          {/* Breadcrumb & Actions Skeleton */}
          <div className="border-t border-border pt-6 space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 bg-muted rounded w-12 animate-pulse" />
              <div className="h-3.5 w-3.5 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded w-20 animate-pulse" />
            </div>

            <div className="flex items-center gap-3">
              <div className="h-6 bg-muted rounded-full w-16 animate-pulse" />
              <div className="h-5 bg-muted rounded w-full max-w-2xl animate-pulse" />
            </div>

            <div className="flex w-full items-center justify-start gap-2 pt-2 flex-wrap">
              <div className="h-10 bg-muted rounded w-28 animate-pulse" />
              <div className="h-10 bg-muted rounded w-32 animate-pulse" />
              <div className="ml-auto flex items-center gap-3">
                <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                <div className="h-9 w-9 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Items Grid Skeleton */}
          <ResponsiveGrid>
            {[...Array(6)].map((_, i) => (
              <Card
                key={i}
                className="group grid grid-rows-[auto_1fr_auto] min-h-96 p-3 shadow-none border-0 bg-transparent"
              >
                {/* Image Header Skeleton */}
                <div className="p-0 space-y-0 row-start-1 row-end-2 col-start-1 col-end-1 relative">
                  <div className="w-full h-40 bg-muted rounded-lg animate-pulse" />
                  <div className="absolute top-2 right-2 z-30">
                    <div className="h-8 w-8 bg-background/80 backdrop-blur-sm rounded-full animate-pulse" />
                  </div>
                </div>

                {/* Content Skeleton */}
                <div className="row-start-2 row-span-1 col-start-1 col-span-1 space-y-3 p-0">
                  <div className="h-6 bg-muted rounded w-4/5 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-full animate-pulse" />
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                </div>

                {/* Footer Skeleton */}
                <div className="row-start-3 row-span-1 col-start-1 col-span-1 grid grid-cols-2 grid-rows-2 gap-1 p-0 items-center">
                  <div className="col-start-1 col-span-2">
                    <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                  </div>
                  <div className="col-start-1 h-5 bg-muted rounded w-20 animate-pulse" />
                  <div className="col-start-2 justify-self-end h-5 bg-muted rounded w-24 animate-pulse" />
                </div>
              </Card>
            ))}
          </ResponsiveGrid>
        </div>
      </div>
    );
  }

  if (error || !wishlist) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="py-12">
          <h1 className="text-2xl font-bold text-muted-foreground mb-4">Unable to load wishlist</h1>
          <p className="text-muted-foreground mb-6">
            There was an error loading this wishlist. It may not exist or may be private.
          </p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Create a UserProfileData-like object for ProfileHeader
  const ownerProfile: UserProfileData = {
    user: {
      id: wishlist.owner?.id || "",
      name: wishlist.owner?.name || undefined,
      email: "", // Not available in wishlist data, but ProfileHeader doesn't use it
      image: wishlist.owner?.image || undefined,
    },
    friendshipStatus,
    wishlists: [], // Not needed for wishlist page
    isOwnProfile: isOwner,
  };

  return (
    <div className="container mx-auto px-4 py-8 container-type-inline-size">
      <div className="space-y-6 @container">
        <ProfileHeader
          profile={ownerProfile}
          title={
            isOwner ? (
              <InlineEditable
                value={wishlist.title}
                onChange={(title) => updateWishlist({ title })}
              />
            ) : (
              wishlist.title
            )
          }
          description={wishlist.description}
          // breadcrumbs={
          //   <Breadcrumb>
          //     <BreadcrumbList>
          //       <BreadcrumbItem>
          //         <BreadcrumbLink asChild>
          //           <Link href="/wishlists">Home</Link>
          //         </BreadcrumbLink>
          //       </BreadcrumbItem>
          //       <BreadcrumbSeparator />
          //       {isOwner ? (
          //         <BreadcrumbItem>
          //           <BreadcrumbLink asChild>
          //             <Link href="/wishlists">My Wishlists</Link>
          //           </BreadcrumbLink>
          //         </BreadcrumbItem>
          //       ) : (
          //         <>
          //           <BreadcrumbItem>
          //             <BreadcrumbLink asChild>
          //               <Link href="/friends">Friends</Link>
          //             </BreadcrumbLink>
          //           </BreadcrumbItem>
          //           <BreadcrumbSeparator />
          //           <BreadcrumbItem>
          //             <BreadcrumbLink asChild>
          //               <Link href={`/u/${wishlist.owner?.id}`} className="flex items-center gap-2">
          //                 <UserAvatar user={wishlist.owner} size="medium" />
          //                 {wishlist.owner?.name}
          //               </Link>
          //             </BreadcrumbLink>
          //           </BreadcrumbItem>
          //         </>
          //       )}
          //     </BreadcrumbList>
          //   </Breadcrumb>
          // }
        >
          <div className="space-y-4 flex flex-col items-center">
            <div className="flex items-center justify-center flex-wrap gap-2">
              <PrivacyBadge
                privacy={wishlist.privacy as "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE"}
                onChange={isOwner ? (privacy) => updateWishlist({ privacy }) : undefined}
              />
              {wishlist.occasions.map((occasion) => (
                <OccasionBadge key={occasion.id} occasion={occasion} />
              ))}
            </div>
          </div>
          <FilterBar>
            {isOwner && (
              <>
                <Button
                  size="small"
                  className="flex items-center gap-2"
                  onClick={() => setShowAddItem(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
                <Button size="small" variant="outline" asChild>
                  <Link href={{ pathname: `/w/${wishlist.permalink}/edit` }}>Edit details</Link>
                </Button>
              </>
            )}
          </FilterBar>
        </ProfileHeader>

        {/* Items */}
        {wishlist.items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No items yet</h3>
              <p className="text-muted-foreground">
                This wishlist is empty.
                {isOwner && " Add some items to get started!"}
              </p>
            </CardContent>
          </Card>
        ) : processedItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No items match your filters</h3>
              <p className="text-muted-foreground">Try adjusting your filters to see more items.</p>
            </CardContent>
          </Card>
        ) : (
          <ResponsiveGrid>
            {processedItems.map((item) => (
              <WishlistItemCard
                key={item.id}
                itemId={item.id}
                wishlistPermalink={wishlist?.permalink || ""}
                isOwner={isOwner}
                onClaim={handleClaim}
                onEdit={isOwner ? setEditingItem : undefined}
                onDelete={isOwner ? handleDeleteItem : undefined}
                onMove={isOwner ? handleMoveItem : undefined}
                isClaimPending={claimMutation.isPending}
                isLoading={isLoading}
                refetchWishlist={refetch}
              />
            ))}
          </ResponsiveGrid>
        )}
      </div>

      <AddItemModal
        isOpen={showAddItem}
        onClose={() => setShowAddItem(false)}
        wishlistPermalink={wishlist?.permalink || ""}
      />

      {editingItem && (
        <EditItemModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          item={{
            id: editingItem.id,
            name: editingItem.name,
            description: editingItem.description,
            url: editingItem.url,
            imageUrl: editingItem.imageUrl,
            price: editingItem.price,
            currency: editingItem.currency,
            priority: editingItem.priority,
            wishlistId: wishlist?.id || "",
          }}
        />
      )}

      <MoveItemsModal
        isOpen={moveModalOpen}
        onClose={() => {
          setMoveModalOpen(false);
          setItemsToMove({ ids: [], names: [] });
        }}
        itemIds={itemsToMove.ids}
        itemNames={itemsToMove.names}
        currentWishlistId={wishlist?.id || ""}
      />
    </div>
  );
};
