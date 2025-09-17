"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { ItemForm, type ItemFormData } from "@/components/ItemForm";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ItemFormData) => void;
  mode: "create" | "edit";
  initialData?: Partial<ItemFormData>;
  isSubmitting?: boolean;
  error?: string | null;
}

export function ItemModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  isSubmitting = false,
  error = null,
}: ItemModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle modal open/close animations
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to trigger entrance animation
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      // Wait for exit animation to complete before removing from DOM
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200); // Match the animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/** biome-ignore lint/a11y/noStaticElementInteractions: esc key works */}
      {/** biome-ignore lint/a11y/useKeyWithClickEvents: esc key works */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Animated Modal */}
      <div
        className={`relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 transition-all duration-200 ${
          isAnimating ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        <Card className="animate-in slide-in-from-bottom-4 fade-in-0 duration-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{mode === "create" ? "Add New Item" : "Edit Item"}</CardTitle>
                <CardDescription>
                  {mode === "create"
                    ? "Add a new item to your wishlist"
                    : "Update the item details"}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ItemForm
              mode={mode}
              initialData={initialData}
              onSubmit={onSubmit}
              onCancel={onClose}
              isSubmitting={isSubmitting}
              error={error}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
