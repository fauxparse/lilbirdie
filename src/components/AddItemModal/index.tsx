import { useMutation } from "@tanstack/react-query";
import { Gift } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Modal, ModalHeader, ModalTitle } from "@/components/ui/Modal";
import { useWishlist } from "@/contexts/WishlistContext";
import type { WishlistItemWithClaims } from "@/types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ItemForm, ItemFormData } from "./ItemForm";
import { useURLScraper } from "./useURLScraper";

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
  const { scrapeURL, isScraping, data: queryData, isError, error } = useURLScraper();
  const [scrapedData, setScrapedData] = useState<ItemFormData | null>(null);
  const [scrapingError, setScrapingError] = useState<string | null>(null);
  const { addItemToCache } = useWishlist();

  const urlInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setModalState("paste");
      setScrapedData(null);
      setScrapingError(null);
    }
  }, [isOpen]);

  // Handle query data when it becomes available
  useEffect(() => {
    if (queryData) {
      if ("name" in queryData) {
        // Success case - we have scraped data
        setScrapedData(queryData);
        setScrapingError(null);
        setModalState("form");
      } else if ("error" in queryData) {
        // Error case - display the error message
        setScrapingError(queryData.error);
        setScrapedData(null);
      }
    }
  }, [queryData]);

  // Handle query errors (network errors, etc.)
  useEffect(() => {
    if (isError && error) {
      setScrapingError(error.message);
    }
  }, [isError, error]);

  const handleUrlPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (!e.clipboardData) return;

    const pastedUrl = e.clipboardData.getData("text").trim();
    try {
      new URL(pastedUrl);
      e.currentTarget.value = pastedUrl;
      setScrapingError(null); // Clear any previous errors
      scrapeURL(pastedUrl.trim());
      // The data will be available in the query result, we'll handle it in a useEffect
    } catch {
      // Invalid URL
      setScrapingError("Invalid URL");
    }
  };

  const { mutateAsync: addItem } = useMutation({
    mutationFn: async (data: ItemFormData): Promise<WishlistItemWithClaims> => {
      const response = await fetch(`/api/wishlists/${wishlistPermalink}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Failed to add item");
      }

      return response.json();
    },
    onSuccess: (newItem) => {
      addItemToCache(newItem);
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
                    ref={urlInput}
                    type="url"
                    className="w-full text-center focus-visible:shadow-none"
                    placeholder="https://example.com/product"
                    onPaste={handleUrlPaste}
                    autoFocus
                  />
                  {scrapingError ? (
                    <div className="text-center text-balance">
                      <p className="text-destructive text-sm font-medium mb-1">{scrapingError}</p>
                      <p className="text-muted-foreground text-xs">
                        You can still enter the details manually below
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center text-balance text-sm">
                      We'll do our best to fill in the details for you (some websites work better
                      than others)
                    </p>
                  )}
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
                initialData={scrapedData || { name: "", url: urlInput.current?.value || "" }}
                onBack={() => setModalState("paste")}
                onCancel={onClose}
                onSubmit={handleSubmit}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Modal>
  );
};
