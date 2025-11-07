"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader } from "./Modal";

interface RouteModalProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  size?: "small" | "md" | "large" | "xl" | "2xl" | "full";
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
}

/**
 * RouteModal - A reusable modal wrapper for Next.js parallel/intercepting routes
 *
 * This component solves the problem of routes unmounting immediately when navigating away,
 * by delaying the actual unmount until after the exit animation completes.
 *
 * Usage:
 * 1. Create a parallel route slot @modal in your layout
 * 2. Create an intercepting route like (.)new/page.tsx
 * 3. Wrap your content with RouteModal in the intercepting route
 *
 * Example:
 * ```tsx
 * // app/wishlists/(.)new/page.tsx
 * export default function NewWishlistModal() {
 *   return (
 *     <RouteModal title="Create New Wishlist">
 *       <YourFormContent />
 *     </RouteModal>
 *   );
 * }
 * ```
 */
export function RouteModal({
  children,
  title,
  description,
  size = "xl",
  closeOnEscape = true,
  closeOnOverlayClick = true,
}: RouteModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  // Open modal after mount to trigger enter animation
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    // Start exit animation
    setIsOpen(false);

    // Wait for exit animation to complete before navigating
    // This matches the Modal component's exit duration (0.2s)
    setTimeout(() => {
      setShouldRender(false);
      router.back();
    }, 220);
  };

  // Don't render if we're in the process of closing
  if (!shouldRender) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size={size}
      closeOnEscape={closeOnEscape}
      closeOnOverlayClick={closeOnOverlayClick}
      className="flex flex-col"
    >
      {(title || description) && (
        <ModalHeader>
          {title}
          {description}
        </ModalHeader>
      )}
      <ModalContent padding={0}>{children}</ModalContent>
    </Modal>
  );
}
