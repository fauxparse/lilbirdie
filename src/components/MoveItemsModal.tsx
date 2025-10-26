"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderOpen, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/Modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

interface Wishlist {
  id: string;
  title: string;
  _count: {
    items: number;
  };
}

interface MoveItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemIds: string[];
  itemNames: string[];
  currentWishlistId: string;
}

export function MoveItemsModal({
  isOpen,
  onClose,
  itemIds,
  itemNames,
  currentWishlistId,
}: MoveItemsModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedWishlistId, setSelectedWishlistId] = useState<string>("");
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newWishlistTitle, setNewWishlistTitle] = useState("");

  // Fetch user's wishlists
  const { data: wishlists, isLoading: wishlistsLoading } = useQuery<Wishlist[]>({
    queryKey: ["wishlists"],
    queryFn: async () => {
      const response = await fetch("/api/wishlists");
      if (!response.ok) {
        throw new Error("Failed to fetch wishlists");
      }
      return response.json();
    },
    enabled: isOpen && !!user,
  });

  // Create new wishlist mutation
  const createWishlistMutation = useMutation({
    mutationFn: async (title: string): Promise<{ id: string; title: string }> => {
      const response = await fetch("/api/wishlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: "",
          privacy: "FRIENDS_ONLY",
          isDefault: false,
        }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Failed to create wishlist");
      }

      return response.json() as Promise<{ id: string; title: string }>;
    },
    onSuccess: (newWishlist: { id: string; title: string }) => {
      // Invalidate wishlists query to show the new wishlist
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
      // Auto-select the new wishlist
      setSelectedWishlistId(newWishlist.id);
      setShowCreateNew(false);
      setNewWishlistTitle("");
      toast.success(`Created wishlist "${newWishlist.title}"`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Move items mutation
  const moveItemsMutation = useMutation({
    mutationFn: async (
      targetWishlistId: string
    ): Promise<{
      movedItemsCount: number;
      targetWishlistId: string;
    }> => {
      const response = await fetch("/api/items/move", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemIds,
          targetWishlistId,
        }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Failed to move items");
      }

      return response.json() as Promise<{
        movedItemsCount: number;
        targetWishlistId: string;
      }>;
    },
    onSuccess: (result: { movedItemsCount: number; targetWishlistId: string }) => {
      // Invalidate queries to refresh both source and target wishlists
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });

      const itemCount = result.movedItemsCount;
      const itemText = itemCount === 1 ? "item" : "items";
      const targetWishlist = wishlists?.find((w) => w.id === result.targetWishlistId);

      toast.success(`Moved ${itemCount} ${itemText} to "${targetWishlist?.title}"`);
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateNewWishlist = () => {
    if (!newWishlistTitle.trim()) {
      toast.error("Please enter a wishlist title");
      return;
    }
    createWishlistMutation.mutate(newWishlistTitle.trim());
  };

  const handleMoveItems = () => {
    if (!selectedWishlistId) {
      toast.error("Please select a destination wishlist");
      return;
    }

    if (selectedWishlistId === currentWishlistId) {
      toast.error("Items are already in this wishlist");
      return;
    }

    moveItemsMutation.mutate(selectedWishlistId);
  };

  const handleClose = () => {
    setSelectedWishlistId("");
    setShowCreateNew(false);
    setNewWishlistTitle("");
    onClose();
  };

  // Filter out the current wishlist from options
  const availableWishlists = wishlists?.filter((w) => w.id !== currentWishlistId) || [];

  const itemCount = itemIds.length;
  const itemText = itemCount === 1 ? "item" : "items";
  const displayNames =
    itemNames.length > 2
      ? `${itemNames.slice(0, 2).join(", ")} and ${itemNames.length - 2} more`
      : itemNames.join(", ");

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalHeader>
        <ModalTitle>
          Move {itemCount} {itemText}
        </ModalTitle>
      </ModalHeader>
      <ModalContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Moving: <span className="font-medium">{displayNames}</span>
          </p>

          {!showCreateNew ? (
            <div className="space-y-3">
              <Label htmlFor="wishlist-select">Choose destination wishlist</Label>
              <Select
                value={selectedWishlistId}
                onValueChange={setSelectedWishlistId}
                disabled={wishlistsLoading}
              >
                <SelectTrigger id="wishlist-select">
                  <SelectValue
                    placeholder={wishlistsLoading ? "Loading..." : "Select a wishlist"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableWishlists.map((wishlist) => (
                    <SelectItem key={wishlist.id} value={wishlist.id}>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        <span>{wishlist.title}</span>
                        <span className="text-xs text-muted-foreground">
                          ({wishlist._count.items} items)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="small"
                onClick={() => setShowCreateNew(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Wishlist
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="new-wishlist-title">New wishlist title</Label>
              <Input
                id="new-wishlist-title"
                placeholder="Enter wishlist title"
                value={newWishlistTitle}
                onChange={(e) => setNewWishlistTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !createWishlistMutation.isPending) {
                    handleCreateNewWishlist();
                  }
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <Button variant="outline" size="small" onClick={() => setShowCreateNew(false)}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  onClick={handleCreateNewWishlist}
                  disabled={createWishlistMutation.isPending || !newWishlistTitle.trim()}
                >
                  {createWishlistMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleMoveItems}
              disabled={
                !selectedWishlistId ||
                moveItemsMutation.isPending ||
                selectedWishlistId === currentWishlistId
              }
            >
              {moveItemsMutation.isPending ? "Moving..." : `Move ${itemText}`}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
