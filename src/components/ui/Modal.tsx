"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import * as React from "react";
import { createContext, type ReactNode, useContext, useEffect, useRef } from "react";
import { RemoveScroll } from "react-remove-scroll";

import { cn } from "@/lib/utils";
import { Button } from "./Button";

type ExceptLayoutProps<T> = Omit<
  T,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd" | "onTransitionEnd"
>;

// Context to track modal nesting level
const ModalLevelContext = createContext<{
  level: number;
  incrementLevel: () => void;
  decrementLevel: () => void;
}>({
  level: 0,
  incrementLevel: () => {},
  decrementLevel: () => {},
});

const ModalContext = createContext<{
  isOpen: boolean;
  onClose: () => void;
} | null>(null);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export function ModalProvider({ children }: { children: ReactNode }) {
  const [level, setLevel] = React.useState(0);

  const incrementLevel = () => setLevel((prev) => prev + 1);
  const decrementLevel = () => setLevel((prev) => Math.max(0, prev - 1));

  return (
    <ModalLevelContext.Provider value={{ level, incrementLevel, decrementLevel }}>
      {children}
    </ModalLevelContext.Provider>
  );
}

type ModalSize = "small" | "md" | "large" | "xl" | "2xl" | "full";

interface ModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  size?: ModalSize;
  className?: string;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  preventAutoFocus?: boolean;
}

const overlayVariants: Variants = {
  hidden: (isFirstModal: boolean) => ({
    opacity: 0,
    backdropFilter: isFirstModal ? "blur(0px)" : undefined,
  }),
  visible: (isFirstModal: boolean) => ({
    opacity: 1,
    backdropFilter: isFirstModal ? "blur(4px)" : undefined,
    transition: {
      opacity: {
        duration: 0.25,
        ease: "easeOut",
      },
      backdropFilter: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  }),
  exit: (isFirstModal: boolean) => ({
    opacity: 0,
    backdropFilter: isFirstModal ? "blur(0px)" : undefined,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  }),
};

const contentVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.85,
    y: 40,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 18,
      stiffness: 260,
      mass: 0.9,
      opacity: {
        duration: 0.25,
        ease: "easeOut",
      },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -15,
    transition: {
      duration: 0.18,
      ease: "easeIn",
    },
  },
};

const sizeClasses: Record<ModalSize, string> = {
  small: "max-w-sm",
  md: "max-w-md",
  large: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-[95vw] max-h-[95vh]",
};

const FocusTrap = ({ children, isActive }: { children: ReactNode; isActive: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element on mount
    if (firstElement && !document.activeElement?.closest('[role="dialog"]')) {
      firstElement.focus();
    }

    document.addEventListener("keydown", handleTabKey);
    return () => document.removeEventListener("keydown", handleTabKey);
  }, [isActive]);

  return (
    <div ref={containerRef} className="contents">
      {children}
    </div>
  );
};

// Root Modal component
export const Modal = ({
  children,
  isOpen,
  onClose,
  size = "md",
  className,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  preventAutoFocus = false,
}: ModalProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const modalContext = useContext(ModalLevelContext);
  const mousedownTargetRef = useRef<EventTarget | null>(null);

  // Capture this modal's level when it's created (never changes)
  const modalLevel = useRef<number | null>(null);
  if (modalLevel.current === null && isOpen) {
    modalLevel.current = modalContext.level;
  }

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeOnEscape, isOpen, onClose]);

  // Track modal level for nesting
  useEffect(() => {
    if (isOpen) {
      modalContext.incrementLevel();
      return () => {
        modalContext.decrementLevel();
      };
    }
    // Reset modal level when closed
    modalLevel.current = null;
  }, [isOpen, modalContext]);

  // Reset mousedown target ref on mouseup to prevent stale state
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseUp = () => {
      // Small delay to ensure click handler runs first
      setTimeout(() => {
        mousedownTargetRef.current = null;
      }, 0);
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if mousedown started on the overlay (not inside content)
    if (
      closeOnOverlayClick &&
      e.target === e.currentTarget &&
      mousedownTargetRef.current === e.currentTarget
    ) {
      onClose();
    }
    // Reset the ref after handling the click
    mousedownTargetRef.current = null;
  };

  return (
    <ModalContext.Provider value={{ isOpen, onClose }}>
      <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <AnimatePresence mode="wait">
          {isOpen && (
            <DialogPrimitive.Portal forceMount>
              <RemoveScroll enabled={isOpen && modalLevel.current === 0}>
                <motion.div
                  className={cn(
                    "fixed inset-0 flex items-center justify-center p-4",
                    modalLevel.current === 0 ? "z-50 bg-modal-overlay/80" : "z-[51] bg-transparent"
                  )}
                  style={{
                    // Dynamic z-index for deeply nested modals
                    zIndex: 50 + (modalLevel.current || 0),
                  }}
                  data-slot="modal-overlay"
                  data-modal-level={modalLevel.current}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={overlayVariants}
                  custom={modalLevel.current === 0}
                  onClick={handleOverlayClick}
                  onMouseDown={(e) => {
                    // Only track if mousedown is directly on the overlay (not a child)
                    if (e.target === e.currentTarget) {
                      mousedownTargetRef.current = e.currentTarget;
                    }
                  }}
                >
                  {/* Content */}
                  <FocusTrap isActive={isOpen && !preventAutoFocus}>
                    <motion.div
                      ref={contentRef}
                      className={cn(
                        "relative w-full bg-background rounded-xl shadow-2xl ring-1 ring-border/10",
                        "border border-border",
                        "max-h-[90vh] overflow-hidden",
                        sizeClasses[size],
                        className
                      )}
                      style={{
                        // Ensure content is above its overlay
                        zIndex: 50 + (modalLevel.current || 0) + 1,
                      }}
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      transition={{
                        layout: {
                          type: "spring",
                          damping: 22,
                          stiffness: 280,
                        },
                      }}
                      role="dialog"
                      aria-modal="true"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => {
                        // Mark that mousedown started inside the content
                        mousedownTargetRef.current = e.currentTarget;
                      }}
                    >
                      {children}
                    </motion.div>
                  </FocusTrap>
                </motion.div>
              </RemoveScroll>
            </DialogPrimitive.Portal>
          )}
        </AnimatePresence>
      </DialogPrimitive.Root>
    </ModalContext.Provider>
  );
};

// Modal Header component
export function ModalHeader({
  children,
  className,
  showCloseButton = true,
  ...props
}: ExceptLayoutProps<React.HTMLAttributes<HTMLDivElement>> & {
  showCloseButton?: boolean;
}) {
  const { onClose } = useModal();

  return (
    <motion.div
      className={cn("flex items-start justify-between p-5 pb-3", className)}
      layout
      data-slot="modal-header"
      {...props}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {showCloseButton && onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="-m-2 ml-4 rounded-full"
          onClick={onClose}
          aria-label="Close modal"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <X className="h-4 w-4" />
          </motion.div>
        </Button>
      )}
    </motion.div>
  );
}

// Modal Title component
export function ModalTitle({
  children,
  className,
  ...props
}: ExceptLayoutProps<React.HTMLAttributes<HTMLHeadingElement>>) {
  return (
    <motion.h2
      className={cn("text-xl font-medium leading-6 text-foreground", className)}
      layout
      {...props}
    >
      {children}
    </motion.h2>
  );
}

// Modal Description component
export function ModalDescription({
  children,
  className,
  ...props
}: ExceptLayoutProps<React.HTMLAttributes<HTMLParagraphElement>>) {
  return (
    <motion.p className={cn("mt-1 text-sm text-muted-foreground", className)} layout {...props}>
      {children}
    </motion.p>
  );
}

type ModalContentProps = ExceptLayoutProps<React.HTMLAttributes<HTMLDivElement>> & {
  padding?: number;
};

// Modal Content component
export function ModalContent({ children, className, padding = 5, ...props }: ModalContentProps) {
  return (
    <motion.div
      className={cn("min-h-0 flex-1 flex flex-col", padding > 0 && "overflow-y-auto")}
      layout
      data-slot="modal-content"
      {...props}
    >
      <motion.div
        className={cn(
          `flex-1 min-h-0 flex flex-col`,
          padding > 0 && `px-${padding} pt-2 pb-3 last:pb-${padding}`,
          className
        )}
        layout="position"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// Modal Footer component
export function ModalFooter({
  children,
  className,
  ...props
}: ExceptLayoutProps<React.HTMLAttributes<HTMLDivElement>>) {
  return (
    <motion.div
      className={cn("flex gap-3 justify-end p-5 pt-2", className)}
      data-slot="modal-footer"
      layout="position"
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Convenience components for common modal patterns
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="small">
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
        {description && <ModalDescription>{description}</ModalDescription>}
      </ModalHeader>
      <ModalFooter>
        <motion.button
          type="button"
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg border border-input hover:bg-accent transition-colors"
          onClick={onClose}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {cancelText}
        </motion.button>
        <motion.button
          type="button"
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            variant === "destructive"
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => {
            onConfirm();
            onClose();
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {confirmText}
        </motion.button>
      </ModalFooter>
    </Modal>
  );
}
