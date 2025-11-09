import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { WishlistCard } from "@/components/WishlistCard";

/**
 * Loading state for the wishlists page.
 * Displays skeleton cards in the same responsive grid layout as the real content.
 */
export default function WishlistsLoading() {
  return (
    <div className="space-y-6 @container">
      <ResponsiveGrid>
        {/* Render 4 wishlist skeletons (typical count for most users) */}
        {Array.from({ length: 4 }).map((_, i) => (
          <WishlistCard.Skeleton key={i} />
        ))}
      </ResponsiveGrid>
    </div>
  );
}
