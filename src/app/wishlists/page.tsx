import { requireAuth } from "@/lib/server/auth";
import { fetchUserWishlists } from "@/lib/server/data-fetchers";
import { WishlistsClient } from "./WishlistsClient";

export default async function WishlistsPage() {
  // Require authentication - redirects to login if not authenticated
  await requireAuth();

  // Fetch wishlists data on the server
  const wishlists = await fetchUserWishlists();

  // Convert to summary format for the client
  const wishlistSummaries = wishlists.map((wishlist) => ({
    id: wishlist.id,
    title: wishlist.title,
    description: wishlist.description || undefined,
    permalink: wishlist.permalink,
    privacy: wishlist.privacy,
    isDefault: wishlist.isDefault,
    createdAt: wishlist.createdAt,
    _count: wishlist._count,
  }));

  return <WishlistsClient initialData={wishlistSummaries} />;
}
