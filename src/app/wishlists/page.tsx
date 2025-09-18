"use client";

import { useQuery } from "@tanstack/react-query";
import { Gift, Lock, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

interface Wishlist {
  id: string;
  title: string;
  description?: string;
  privacy: "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";
  isDefault: boolean;
  permalink: string;
  _count: {
    items: number;
  };
  createdAt: string;
}

function PrivacyIcon({ privacy }: { privacy: Wishlist["privacy"] }) {
  switch (privacy) {
    case "PUBLIC":
      return <Users className="h-4 w-4" />;
    case "FRIENDS_ONLY":
      return <Users className="h-4 w-4 text-blue-500" />;
    case "PRIVATE":
      return <Lock className="h-4 w-4 text-gray-500" />;
  }
}

function PrivacyLabel({ privacy }: { privacy: Wishlist["privacy"] }) {
  switch (privacy) {
    case "PUBLIC":
      return "Public";
    case "FRIENDS_ONLY":
      return "Friends only";
    case "PRIVATE":
      return "Private";
  }
}

export default function WishlistsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const {
    data: wishlists,
    isLoading,
    error,
  } = useQuery<Wishlist[]>({
    queryKey: ["wishlists"],
    queryFn: async () => {
      const response = await fetch("/api/wishlists");
      if (!response.ok) {
        throw new Error("Failed to fetch wishlists");
      }
      return response.json();
    },
    enabled: !!user,
  });

  if (isAuthLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading your wishlists...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">Failed to load wishlists. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Wishlists</h1>
          <p className="text-gray-600 mt-2">Manage your wishlists and share them with friends</p>
        </div>
        <Button asChild>
          <Link href="/wishlists/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Wishlist
          </Link>
        </Button>
      </div>

      {wishlists && wishlists.length === 0 ? (
        <div className="text-center py-12">
          <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No wishlists yet</h2>
          <p className="text-gray-500 mb-6">
            Create your first wishlist to start collecting your favorite items
          </p>
          <Button asChild>
            <Link href="/wishlists/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Wishlist
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlists?.map((wishlist) => (
            <Card key={wishlist.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Link href={`/w/${wishlist.permalink}`} className="hover:underline">
                        {wishlist.title}
                      </Link>
                      {wishlist.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          Default
                        </span>
                      )}
                    </CardTitle>
                    {wishlist.description && (
                      <CardDescription className="mt-2">{wishlist.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <PrivacyIcon privacy={wishlist.privacy} />
                    <span>
                      <PrivacyLabel privacy={wishlist.privacy} />
                    </span>
                  </div>
                  <span>
                    {wishlist._count.items} item{wishlist._count.items !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="small" asChild className="flex-1">
                    <Link href={`/w/${wishlist.permalink}`}>View</Link>
                  </Button>
                  <Button variant="outline" size="small" asChild className="flex-1">
                    <Link href={`/wishlists/${wishlist.permalink}/edit`}>Edit</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
