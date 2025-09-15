"use client";

import { useAuth } from "@/components/AuthProvider";
import { ItemForm, type ItemFormData } from "@/components/ItemForm";
import { WishlistItemCard } from "@/components/WishlistItemCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { WishlistItemWithRelations } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift, Plus, User, X } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

interface WishlistItem {
  id: string;
  name: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  price?: number | string;
  currency: string;
  priority: number;
  claims?: Array<{
    userId: string;
    createdAt: string;
  }>;
}

interface PublicWishlist {
  id: string;
  title: string;
  description?: string;
  permalink: string;
  privacy: string;
  owner: {
    id: string;
    name?: string;
    email: string;
    image?: string;
  };
  items: WishlistItem[];
  _count: {
    items: number;
  };
}

export default function PublicWishlistPage({
  params,
}: {
  params: Promise<{ permalink: string }>;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { permalink } = React.use(params);

  const {
    data: wishlist,
    isLoading,
    error,
  } = useQuery<PublicWishlist>({
    queryKey: ["public-wishlist", permalink],
    queryFn: async () => {
      const response = await fetch(`/api/w/${permalink}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("NOT_FOUND");
        }
        throw new Error("Failed to fetch wishlist");
      }
      return response.json();
    },
  });

  const claimMutation = useMutation({
    mutationFn: async ({ itemId, action }: { itemId: string; action: "claim" | "unclaim" }) => {
      const method = action === "claim" ? "POST" : "DELETE";
      const response = await fetch(`/api/w/${permalink}/items/${itemId}/claim`, {
        method,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update claim");
      }

      return response.json();
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["public-wishlist", permalink] });
      toast.success(action === "claim" ? "Item claimed!" : "Item unclaimed!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Item management state
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItemWithRelations | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      const response = await fetch(`/api/wishlists/${wishlist?.id}/items`, {
        method: "POST",
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-wishlist", permalink] });
      setShowAddItem(false);
      toast.success("Item added successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Edit item mutation
  const editItemMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      if (!editingItem) throw new Error("No item selected for editing");

      const response = await fetch(`/api/items/${editingItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update item");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-wishlist", permalink] });
      setEditingItem(null);
      toast.success("Item updated successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-wishlist", permalink] });
      toast.success("Item deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddItem = (data: ItemFormData) => {
    addItemMutation.mutate(data);
  };

  const handleEditItem = (data: ItemFormData) => {
    editItemMutation.mutate(data);
  };

  const handleDeleteItem = (itemId: string) => {
    setItemToDelete(itemId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteItemMutation.mutate(itemToDelete);
      setItemToDelete(null);
      setDeleteDialogOpen(false);
    }
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
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
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

  const isOwner = user?.id === wishlist.owner.id;

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{wishlist.title}</h1>
            {wishlist.description && (
              <p className="text-muted-foreground mt-2">{wishlist.description}</p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-2">
                {wishlist.owner.image ? (
                  <img
                    src={wishlist.owner.image}
                    alt={wishlist.owner.name || "Owner"}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  by {wishlist.owner.name || wishlist.owner.email}
                </span>
              </div>
              <Badge variant="outline" className="ml-2">
                {wishlist.privacy === "PUBLIC"
                  ? "Public"
                  : wishlist.privacy === "FRIENDS_ONLY"
                    ? "Friends Only"
                    : "Private"}
              </Badge>
            </div>
          </div>

          {isOwner && (
            <div className="flex gap-2">
              <Button onClick={() => setShowAddItem(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/wishlists/${wishlist.permalink}/edit` as any}>Edit Wishlist</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/wishlists">My Wishlists</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Add Item Form */}
        {showAddItem && isOwner && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add New Item</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddItem(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ItemForm
                mode="create"
                onSubmit={handleAddItem}
                onCancel={() => setShowAddItem(false)}
                isSubmitting={addItemMutation.isPending}
                error={addItemMutation.error?.message || null}
              />
            </CardContent>
          </Card>
        )}

        {/* Edit Item Form */}
        {editingItem && isOwner && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edit Item</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingItem(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ItemForm
                mode="edit"
                initialData={{
                  name: editingItem.name,
                  description: editingItem.description || undefined,
                  url: editingItem.url || undefined,
                  imageUrl: editingItem.imageUrl || undefined,
                  price:
                    typeof editingItem.price === "number"
                      ? editingItem.price
                      : Number.parseFloat(editingItem.price?.toString() || "0"),
                  currency: editingItem.currency,
                  priority: editingItem.priority,
                  tags: [], // TODO: Add tags when available in item data
                }}
                onSubmit={handleEditItem}
                onCancel={() => setEditingItem(null)}
                isSubmitting={editItemMutation.isPending}
                error={editItemMutation.error?.message || null}
              />
            </CardContent>
          </Card>
        )}

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
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {wishlist.items.map((item) => (
              <WishlistItemCard
                key={item.id}
                itemId={item.id}
                wishlistPermalink={permalink}
                isOwner={isOwner}
                onClaim={handleClaim}
                onEdit={isOwner ? setEditingItem : undefined}
                onDelete={isOwner ? handleDeleteItem : undefined}
                isClaimPending={claimMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
