"use client";

import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lock, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Privacy = "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";

export default function NewWishlistPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("FRIENDS_ONLY");
  const [isDefault, setIsDefault] = useState(false);

  const createWishlistMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      privacy: Privacy;
      isDefault: boolean;
    }) => {
      const response = await fetch("/api/wishlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create wishlist");
      }

      return response.json();
    },
    onSuccess: (wishlist) => {
      // Invalidate wishlists query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
      // Navigate to the new wishlist
      router.push(`/wishlists/${wishlist.permalink}` as any);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    createWishlistMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      privacy,
      isDefault,
    });
  };

  if (isAuthLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/wishlists">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Wishlists
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create New Wishlist</h1>
        <p className="text-gray-600 mt-2">Start collecting your favorite items in a new wishlist</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wishlist Details</CardTitle>
          <CardDescription>Give your wishlist a name and configure who can see it</CardDescription>
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
              <Button
                type="submit"
                disabled={!title.trim() || createWishlistMutation.isPending}
                className="flex-1"
              >
                {createWishlistMutation.isPending ? "Creating..." : "Create Wishlist"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/wishlists">Cancel</Link>
              </Button>
            </div>

            {createWishlistMutation.error && (
              <div className="text-sm text-red-600">{createWishlistMutation.error.message}</div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
