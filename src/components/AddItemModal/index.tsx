import { Gift } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ItemForm, ItemFormData } from "./ItemForm";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalState = "paste" | "form";

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose }) => {
  const [modalState, setModalState] = useState<ModalState>("paste");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<ItemFormData | null>(null);

  useEffect(() => {
    if (isOpen) {
      setModalState("paste");
      setIsScraping(false);
    }
  }, [isOpen]);

  const scrapeUrl = async (url: string) => {
    setIsScraping(true);
    const response = await fetch("/api/scrape-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });
    setIsScraping(false);
    const json = await response.json();
    setScrapedData(json);
    return json;
  };

  const handleUrlPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (!e.clipboardData) return;

    const pastedUrl = e.clipboardData.getData("text").trim();
    if (URL.canParse(pastedUrl)) {
      e.currentTarget.value = pastedUrl;
      await scrapeUrl(pastedUrl.trim());
      setModalState("form");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Add Item</ModalTitle>
      </ModalHeader>
      <ModalContent>
        <AnimatePresence mode="popLayout">
          {modalState === "paste" && (
            <motion.fieldset
              key="paste"
              className="bg-muted rounded-lg grid place-items-center b-0 p-5"
              disabled={isScraping}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
            </motion.fieldset>
          )}
          {modalState === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ItemForm initialData={scrapedData || { name: "" }} />
            </motion.div>
          )}
        </AnimatePresence>
      </ModalContent>
    </Modal>
  );
};
