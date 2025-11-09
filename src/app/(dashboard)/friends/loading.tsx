import { ProfileCard } from "@/components/ui/ProfileCard";
import { FriendCard } from "@/views/Friends/FriendCard";

/**
 * Loading state for the friends page.
 * Displays skeleton cards in the same responsive grid layout as the real content.
 */
export default function FriendsLoading() {
  return (
    <div className="@container">
      <div className="grid grid-cols-1 @2xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4 gap-4">
        {/* Add friend skeleton (always first) */}
        <ProfileCard.Skeleton />

        {/* Friend card skeletons (typical count: 6-8 friends) */}
        {Array.from({ length: 7 }).map((_, i) => (
          <FriendCard.Skeleton key={i} />
        ))}
      </div>
    </div>
  );
}
