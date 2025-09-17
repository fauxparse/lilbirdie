import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Gift } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal, ModalHeader, ModalTitle } from "@/components/ui/Modal";
import type { WishlistItemWithClaims } from "@/types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ItemForm, ItemFormData } from "./ItemForm";
import { useURLScraper } from "./useURLScraper";

// Local type to match the page structure (more flexible)
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
  items?: WishlistItemWithClaims[];
  _count?: {
    items: number;
  };
}

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistPermalink: string;
}

type ModalState = "paste" | "form";

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  wishlistPermalink,
}) => {
  const [modalState, setModalState] = useState<ModalState>("paste");
  const { scrapeURL, isScraping, data: queryData } = useURLScraper();
  const [scrapedData, setScrapedData] = useState<ItemFormData | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      setModalState("paste");
      setScrapedData(null);
    }
  }, [isOpen]);

  // Handle query data when it becomes available
  useEffect(() => {
    if (queryData && "name" in queryData) {
      setScrapedData(queryData);
      setModalState("form");
    }
  }, [queryData]);

  const handleUrlPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (!e.clipboardData) return;

    const pastedUrl = e.clipboardData.getData("text").trim();
    try {
      new URL(pastedUrl);
      e.currentTarget.value = pastedUrl;
      scrapeURL(pastedUrl.trim());
      // The data will be available in the query result, we'll handle it in a useEffect
    } catch {
      // Invalid URL, do nothing
    }
  };

  const { mutateAsync: addItem } = useMutation({
    mutationFn: async (data: ItemFormData): Promise<WishlistItemWithClaims> => {
      const response = await fetch(`/api/w/${wishlistPermalink}/items`, {
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
    onSuccess: (newItem) => {
      // Update the wishlist cache with the new item
      queryClient.setQueryData(
        ["public-wishlist", wishlistPermalink],
        (oldData: PublicWishlist | undefined) => {
          if (!oldData) return oldData;

          // Ensure items array exists
          const currentItems = oldData.items || [];

          const updatedData: PublicWishlist = {
            ...oldData,
            items: [...currentItems, newItem],
          };

          // Only update _count if it exists in the original data
          if (oldData._count) {
            updatedData._count = {
              ...oldData._count,
              items: (oldData._count.items || currentItems.length) + 1,
            };
          }

          return updatedData;
        }
      );

      // Also set the individual item cache entry
      queryClient.setQueryData(["item", newItem.id], newItem);

      toast.success("Item added successfully!");
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = useCallback(
    (data: ItemFormData) => {
      addItem(data);
    },
    [addItem]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Add Item</ModalTitle>
      </ModalHeader>
      <motion.div layout="position" className="min-h-0">
        <AnimatePresence mode="popLayout">
          {modalState === "paste" && (
            <motion.div
              key="paste"
              className="px-5 pb-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <fieldset
                className="bg-muted rounded-lg grid place-items-center b-0 p-5"
                disabled={isScraping}
              >
                <div className="flex flex-col items-center gap-2">
                  <Gift className="h-32 w-32 text-muted-foreground opacity-50" />
                  <p className="text-foreground text-center text-balance">
                    Paste the URL of the item you want to add
                  </p>
                  <Input
                    type="url"
                    className="w-full text-center focus-visible:shadow-none"
                    placeholder="https://example.com/product"
                    onPaste={handleUrlPaste}
                    autoFocus
                  />
                  <p className="text-muted-foreground text-center text-balance text-sm">
                    We’ll do our best to fill in the details for you (some websites work better than
                    others)
                  </p>
                  <Button variant="outline" onClick={() => setModalState("form")}>
                    Enter details manually
                  </Button>
                </div>
              </fieldset>
            </motion.div>
          )}
          {modalState === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ItemForm
                initialData={scrapedData || { name: "" }}
                onBack={() => setModalState("paste")}
                onSubmit={handleSubmit}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Modal>
  );
};
