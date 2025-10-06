"use client";

import { useMutation } from "@tanstack/react-query";
import { Gift, Plus, Settings2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { AddItemModal } from "@/components/AddItemModal";
import { useAuth } from "@/components/AuthProvider";
import { EditItemModal } from "@/components/EditItemModal";
import { MoveItemsModal } from "@/components/MoveItemsModal";
import { Button } from "@/components/ui/Button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/Card";
import { InlineEditable } from "@/components/ui/InlineEditable";
import { Label } from "@/components/ui/Label";
import {
  PageActions,
  PageHeader,
  PageHeaderDescription,
  PageTitle,
} from "@/components/ui/PageHeader";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { WishlistItemCard } from "@/components/WishlistItemCard";
import { useWishlist, WishlistProvider } from "@/contexts/WishlistContext";
import { useUndoableDelete } from "@/hooks/useUndoableDelete";
import type { WishlistItemWithRelations } from "@/types";

export default function PublicWishlistPage({ params }: { params: Promise<{ permalink: string }> }) {
  const { permalink } = React.use(params);

  return (
    <WishlistProvider permalink={permalink}>
      <WishlistPageContent />
    </WishlistProvider>
  );
}

function WishlistPageContent() {
  const { user } = useAuth();
  const {
    wishlist,
    isLoading,
    isOwner,
    error,
    refetch,
    claimMutation,
    removeItemFromCache,
    updateWishlist,
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

  // Sorting and filtering state
  const [sortBy, setSortBy] = useState<"priority" | "price" | "date">("priority");
  const [hideClaimedItems, setHideClaimedItems] = useState(false);

  // Add item mutation - handled by AddItemModal
  // Edit item mutation - handled by EditItemModal

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete item");
      }

      return response.json();
    },
    onSuccess: (deletedItem, itemId) => {
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

  // Sorting and filtering logic
  const processedItems = React.useMemo(() => {
    if (!wishlist?.items) return [];

    let filteredItems = [...wishlist.items];

    // Apply filtering
    if (hideClaimedItems) {
      filteredItems = filteredItems.filter((item) => {
        const hasClaims = item.claims && item.claims.length > 0;
        return !hasClaims;
      });
    }

    // Apply sorting
    filteredItems.sort((a, b) => {
      switch (sortBy) {
        case "priority":
          // Higher priority first
          return (b.priority || 0) - (a.priority || 0);
        case "price": {
          // Lower price first, null/undefined prices go to end
          const priceA =
            typeof a.price === "number"
              ? a.price
              : typeof a.price === "string"
                ? parseFloat(a.price)
                : Number.MAX_VALUE;
          const priceB =
            typeof b.price === "number"
              ? b.price
              : typeof b.price === "string"
                ? parseFloat(b.price)
                : Number.MAX_VALUE;
          return priceA - priceB;
        }
        case "date":
          // Newer items first
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:
          return 0;
      }
    });

    return filteredItems;
  }, [wishlist?.items, sortBy, hideClaimedItems]);

  if (error?.message === "NOT_FOUND") {
    notFound();
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
          <div className="grid gap-4 cq-sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !wishlist) {
    return (
      <div className="container mx-auto max-w-4xl text-center">
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

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="space-y-6 container-type-inline-size">
        <PageHeader>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {isOwner ? (
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/wishlists">My Wishlists</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              ) : (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/friends">Friends</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={`/u/${wishlist.owner?.id}`} className="flex items-center gap-2">
                        <UserAvatar user={wishlist.owner} size="medium" />
                        {wishlist.owner?.name}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex flex-col gap-2 items-start pt-8 md:pt-10 lg:pt-12">
            <PrivacyBadge
              privacy={wishlist.privacy}
              onChange={isOwner ? (privacy) => updateWishlist({ privacy }) : undefined}
            />
            <PageTitle>
              {isOwner ? (
                <InlineEditable
                  value={wishlist.title}
                  onChange={(title) => updateWishlist({ title })}
                />
              ) : (
                wishlist.title
              )}
            </PageTitle>
          </div>
          <PageHeaderDescription>
            {isOwner ? (
              <InlineEditable
                value={wishlist.description || ""}
                onChange={(description) => updateWishlist({ description })}
              />
            ) : (
              wishlist.description
            )}
          </PageHeaderDescription>
          <PageActions>
            {wishlist.items.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="text-sm text-foreground">
                  {processedItems.length} of {wishlist.items.length} items
                  {hideClaimedItems && processedItems.length < wishlist.items.length && (
                    <span className="ml-1 text-muted-foreground">
                      ({wishlist.items.length - processedItems.length} hidden)
                    </span>
                  )}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon-small"
                      className="flex items-center gap-2 data-active:bg-secondary-hover aria-expanded:bg-secondary-hover"
                      data-active={sortBy !== "priority" || hideClaimedItems || undefined}
                      aria-label="Sort and filter items"
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center gap-3">
                        <Label
                          htmlFor="sort-select"
                          className="text-sm font-medium whitespace-nowrap m-0"
                        >
                          Sort by
                        </Label>
                        <Select
                          value={sortBy}
                          onValueChange={(value: "priority" | "price" | "date") => setSortBy(value)}
                        >
                          <SelectTrigger id="sort-select" size="small">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="priority">Priority (High to Low)</SelectItem>
                            <SelectItem value="price">Price (Low to High)</SelectItem>
                            <SelectItem value="date">Date Added (Newest First)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {!isOwner && (
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="hide-claimed" className="text-sm">
                            Hide claimed items
                          </Label>
                          <Switch
                            id="hide-claimed"
                            checked={hideClaimedItems}
                            onCheckedChange={setHideClaimedItems}
                          />
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </PageActions>
        </PageHeader>
        <header className="flex flex-col">
          <div className="flex items-center gap-3 mt-3 justify-between w-full">
            <div className="flex items-center gap-2"></div>
          </div>

          {isOwner && (
            <div className="flex gap-2">
              <Button onClick={() => setShowAddItem(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/wishlists/${wishlist.permalink}/edit`}>Edit Wishlist</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/wishlists">My Wishlists</Link>
              </Button>
            </div>
          )}
        </header>

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
          <div className="grid gap-4 cq-md:grid-cols-2 cq-lg:grid-cols-3">
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
          </div>
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
            price:
              typeof editingItem.price === "number"
                ? editingItem.price
                : editingItem.price
                  ? Number.parseFloat(editingItem.price.toString())
                  : null,
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
}
