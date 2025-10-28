import { notFound } from "next/navigation";
import { fetchWishlistByPermalink } from "@/lib/server/data-fetchers";
import { WishlistPageContent } from "./WishlistPageContent";

interface WishlistPageProps {
  params: Promise<{ permalink: string }>;
}

export default async function PublicWishlistPage({ params }: WishlistPageProps) {
  const { permalink } = await params;

  // Fetch wishlist data on the server
  const wishlistResult = await fetchWishlistByPermalink(permalink);

  if (!wishlistResult.success) {
    if (wishlistResult.statusCode === 404) {
      notFound();
    }
    // For other errors, we'll let the client handle them
    return <WishlistPageContent permalink={permalink} initialData={null} />;
  }

  return <WishlistPageContent permalink={permalink} initialData={wishlistResult.data} />;
}
