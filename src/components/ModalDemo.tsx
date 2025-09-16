"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  ConfirmModal,
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { motion } from "motion/react";
import { useState } from "react";

export function ModalDemo() {
  const [basicModal, setBasicModal] = useState(false);
  const [resizingModal, setResizingModal] = useState(false);
  const [formModal, setFormModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [nestedModal, setNestedModal] = useState(false);
  const [contentSize, setContentSize] = useState("small");

  // Comparison states
  const [oldDialog, setOldDialog] = useState(false);
  const [oldAlert, setOldAlert] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const generateContent = (size: string) => {
    const baseContent = "This modal demonstrates smooth content resizing animations.";

    switch (size) {
      case "small":
        return baseContent;
      case "medium":
        return `${baseContent} Here's some additional content to show how the modal smoothly expands and contracts. The layout animations are powered by Framer Motion's layout prop.`;
      case "large":
        return `${baseContent} Here's much more content to demonstrate the smooth resizing capabilities. The modal uses Framer Motion's layout animations to smoothly transition between different content sizes. This creates a delightful user experience where the modal feels responsive and alive. You can see how the modal maintains its center position while expanding and contracting. The animations are carefully tuned to feel natural and not jarring. Focus management is also maintained throughout the resize process, ensuring accessibility is never compromised. The modal also handles edge cases like content that might overflow the viewport, automatically adding scroll when necessary.`;
      default:
        return baseContent;
    }
  };

  return (
    <div className="space-y-4 p-8">
      <h1 className="text-2xl font-bold mb-6">Modal Component Demo</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Basic Modal */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={() => setBasicModal(true)} className="w-full">
            Basic Modal
          </Button>
        </motion.div>

        {/* Resizing Content Modal */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={() => setResizingModal(true)} variant="outline" className="w-full">
            Content Resizing
          </Button>
        </motion.div>

        {/* Form Modal */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={() => setFormModal(true)} variant="secondary" className="w-full">
            Form Modal
          </Button>
        </motion.div>

        {/* Confirm Modal */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={() => setConfirmModal(true)} variant="destructive" className="w-full">
            Confirm Dialog
          </Button>
        </motion.div>

        {/* Nested Modal */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={() => setNestedModal(true)} variant="outline" className="w-full">
            Nested Modal
          </Button>
        </motion.div>
      </div>

      {/* Comparison Section */}
      <div className="mt-12 p-6 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
        <h2 className="text-xl font-semibold mb-4 text-center">🔍 Component Comparison</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Compare the new Modal component with existing Dialog and AlertDialog components
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* New Modal */}
          <div className="space-y-3">
            <h3 className="font-medium text-green-600 dark:text-green-400">✨ New Modal</h3>
            <div className="space-y-2">
              <Button onClick={() => setBasicModal(true)} className="w-full" size="sm">
                Basic Modal
              </Button>
              <Button
                onClick={() => setConfirmModal(true)}
                variant="destructive"
                className="w-full"
                size="sm"
              >
                Confirm Modal
              </Button>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✅ Focus trapping</li>
              <li>✅ Smooth animations</li>
              <li>✅ Content resizing</li>
              <li>✅ Nested modal support</li>
              <li>✅ Multiple sizes</li>
              <li>✅ Playful interactions</li>
            </ul>
          </div>

          {/* Old Dialog */}
          <div className="space-y-3">
            <h3 className="font-medium text-orange-600 dark:text-orange-400">📋 Original Dialog</h3>
            <div className="space-y-2">
              <Dialog open={oldDialog} onOpenChange={setOldDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full" size="sm">
                    Basic Dialog
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Original Dialog</DialogTitle>
                    <DialogDescription>
                      This is the standard Radix UI dialog component from shadcn/ui.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm">
                      This component uses CSS animations and standard Radix UI patterns. It's solid
                      but lacks some of the advanced features of the new Modal.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setOldDialog(false)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog open={oldAlert} onOpenChange={setOldAlert}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" size="sm">
                    Alert Dialog
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Original AlertDialog</AlertDialogTitle>
                    <AlertDialogDescription>
                      This is the standard AlertDialog component. It's designed for confirmations
                      and important alerts.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✅ Basic animations</li>
              <li>✅ Accessibility</li>
              <li>❌ Limited focus trapping</li>
              <li>❌ No content resizing</li>
              <li>❌ Basic interactions</li>
              <li>❌ Fixed styling</li>
            </ul>
          </div>

          {/* ItemModal (Current) */}
          <div className="space-y-3">
            <h3 className="font-medium text-blue-600 dark:text-blue-400">🔧 Current ItemModal</h3>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full" size="sm" disabled>
                Custom Modal
              </Button>
              <p className="text-xs text-muted-foreground">(Used in app currently)</p>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✅ Custom animations</li>
              <li>✅ Escape key handling</li>
              <li>❌ Manual focus management</li>
              <li>❌ Body scroll handling</li>
              <li>❌ No nesting support</li>
              <li>❌ Limited reusability</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-background/50 rounded border">
          <h4 className="font-medium text-sm mb-2">🎯 Key Improvements in New Modal:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <strong>🎨 Enhanced UX:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                <li>Framer Motion animations with custom easing</li>
                <li>Smooth content resizing transitions</li>
                <li>Interactive button hover/tap effects</li>
                <li>Multiple responsive size options</li>
              </ul>
            </div>
            <div>
              <strong>🔧 Technical Features:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                <li>Proper focus trap implementation</li>
                <li>Nested modal overlay management</li>
                <li>Context-based modal level tracking</li>
                <li>Configurable close behaviors</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Modal */}
      <Modal isOpen={basicModal} onClose={() => setBasicModal(false)} size="md">
        <ModalHeader onClose={() => setBasicModal(false)}>
          <ModalTitle>Welcome to the Modal</ModalTitle>
          <ModalDescription>
            This is a fully featured modal component with accessibility built in.
          </ModalDescription>
        </ModalHeader>

        <ModalContent>
          <div className="space-y-4">
            <p>This modal demonstrates all the key features:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Focus trapping (try pressing Tab)</li>
              <li>Escape key to close</li>
              <li>Click overlay to close</li>
              <li>Smooth animations with Framer Motion</li>
              <li>Responsive sizing</li>
              <li>Full accessibility support</li>
            </ul>
          </div>
        </ModalContent>

        <ModalFooter>
          <Button variant="outline" onClick={() => setBasicModal(false)}>
            Close
          </Button>
          <Button onClick={() => setBasicModal(false)}>Got it!</Button>
        </ModalFooter>
      </Modal>

      {/* Resizing Content Modal */}
      <Modal isOpen={resizingModal} onClose={() => setResizingModal(false)} size="lg">
        <ModalHeader onClose={() => setResizingModal(false)}>
          <ModalTitle>Content Resizing Demo</ModalTitle>
          <ModalDescription>
            Watch how smoothly the modal resizes as content changes.
          </ModalDescription>
        </ModalHeader>

        <ModalContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={contentSize === "small" ? "default" : "outline"}
                onClick={() => setContentSize("small")}
              >
                Small
              </Button>
              <Button
                size="sm"
                variant={contentSize === "medium" ? "default" : "outline"}
                onClick={() => setContentSize("medium")}
              >
                Medium
              </Button>
              <Button
                size="sm"
                variant={contentSize === "large" ? "default" : "outline"}
                onClick={() => setContentSize("large")}
              >
                Large
              </Button>
            </div>

            <motion.div
              key={contentSize}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              layout
            >
              <p className="text-sm leading-relaxed">{generateContent(contentSize)}</p>
            </motion.div>
          </div>
        </ModalContent>

        <ModalFooter>
          <Button onClick={() => setResizingModal(false)} className="w-full">
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Form Modal */}
      <Modal isOpen={formModal} onClose={() => setFormModal(false)} size="xl">
        <ModalHeader onClose={() => setFormModal(false)}>
          <ModalTitle>Contact Form</ModalTitle>
          <ModalDescription>Fill out this form to get in touch.</ModalDescription>
        </ModalHeader>

        <ModalContent>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell us what you think..."
              />
            </div>
          </form>
        </ModalContent>

        <ModalFooter>
          <Button variant="outline" onClick={() => setFormModal(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={() => setFormModal(false)}>
            Send Message
          </Button>
        </ModalFooter>
      </Modal>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal}
        onClose={() => setConfirmModal(false)}
        onConfirm={() => {
          // Handle confirmation
          console.log("Confirmed!");
        }}
        title="Delete Item"
        description="This action cannot be undone. Are you sure you want to delete this item?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Nested Modal */}
      <Modal isOpen={nestedModal} onClose={() => setNestedModal(false)} size="md">
        <ModalHeader onClose={() => setNestedModal(false)}>
          <ModalTitle>Parent Modal</ModalTitle>
          <ModalDescription>This modal can open other modals.</ModalDescription>
        </ModalHeader>

        <ModalContent>
          <div className="space-y-4">
            <p>This demonstrates that modals can be nested if needed.</p>
            <p className="text-sm text-muted-foreground">
              While generally not recommended for UX, the modal component handles nested modals
              gracefully.
            </p>
          </div>
        </ModalContent>

        <ModalFooter>
          <Button onClick={() => setBasicModal(true)} variant="outline">
            Open Nested Modal
          </Button>
          <Button onClick={() => setNestedModal(false)}>Close This Modal</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
