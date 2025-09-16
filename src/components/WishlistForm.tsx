"use client";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";
import { Lock, Users } from "lucide-react";
import { useEffect, useState } from "react";

type Privacy = "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";

export interface WishlistFormData {
  title: string;
  description?: string;
  privacy: Privacy;
  isDefault: boolean;
}

export interface WishlistFormProps {
  mode: "create" | "edit";
  initialData?: Partial<WishlistFormData>;
  onSubmit: (data: WishlistFormData) => void;
  isSubmitting?: boolean;
  error?: string | null;
  submitLabel?: string;
  onCancel: () => void;
}

export function WishlistForm({
  mode,
  initialData = {},
  onSubmit,
  isSubmitting = false,
  error = null,
  submitLabel,
  onCancel,
}: WishlistFormProps) {
  const [title, setTitle] = useState(initialData.title || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [privacy, setPrivacy] = useState<Privacy>(initialData.privacy || "FRIENDS_ONLY");
  const [isDefault, setIsDefault] = useState(initialData.isDefault || false);

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData.title !== undefined) setTitle(initialData.title);
    if (initialData.description !== undefined) setDescription(initialData.description || "");
    if (initialData.privacy) setPrivacy(initialData.privacy);
    if (initialData.isDefault !== undefined) setIsDefault(initialData.isDefault);
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      privacy,
      isDefault,
    });
  };

  const defaultSubmitLabel = mode === "create" ? "Create Wishlist" : "Update Wishlist";
  const submittingLabel = mode === "create" ? "Creating..." : "Updating...";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wishlist Details</CardTitle>
        <CardDescription>
          {mode === "create"
            ? "Give your wishlist a name and configure who can see it"
            : "Update your wishlist details and privacy settings"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              type="text"
              placeholder="My Awesome Wishlist"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What's this wishlist for? (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Privacy</Label>
            <RadioGroup
              value={privacy}
              onValueChange={(value: string) => setPrivacy(value as Privacy)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PUBLIC" id="public" />
                <Label htmlFor="public" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4" />
                  Public - Anyone can view this wishlist
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="FRIENDS_ONLY" id="friends" />
                <Label htmlFor="friends" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4 text-blue-500" />
                  Friends only - Only your friends can view this wishlist
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PRIVATE" id="private" />
                <Label htmlFor="private" className="flex items-center gap-2 cursor-pointer">
                  <Lock className="h-4 w-4 text-gray-500" />
                  Private - Only you can view this wishlist
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="isDefault" checked={isDefault} onCheckedChange={setIsDefault} />
            <Label htmlFor="isDefault" className="cursor-pointer">
              Set as my default wishlist
            </Label>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={!title.trim() || isSubmitting} className="flex-1">
              {isSubmitting ? submittingLabel : submitLabel || defaultSubmitLabel}
            </Button>
            <Button type="button" variant="outline" asChild onClick={onCancel}>
              Cancel
            </Button>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
        </form>
      </CardContent>
    </Card>
  );
}
