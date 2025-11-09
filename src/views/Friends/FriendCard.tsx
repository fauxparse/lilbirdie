import type { Route } from "next";
import Link from "next/link";
import { ProfileCard } from "@/components/ui/ProfileCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { Friend } from "@/hooks/useFriends";

interface FriendCardProps {
  friend: Friend;
}

function FriendCardComponent({ friend }: FriendCardProps) {
  return (
    <ProfileCard
      as={Link}
      href={`/u/${friend.id}` as Route}
      avatar={<UserAvatar user={friend} />}
      primaryText={<div className="text-small font-medium truncate">{friend.name}</div>}
      secondaryText={
        <div className="text-xs text-muted-foreground">
          {friend.visibleWishlistCount} list{friend.visibleWishlistCount !== 1 ? "s" : ""}
        </div>
      }
    />
  );
}

/**
 * FriendCard.Skeleton - Loading skeleton that matches FriendCard layout
 */
function FriendCardSkeleton() {
  return <ProfileCard.Skeleton />;
}

export const FriendCard = Object.assign(FriendCardComponent, {
  Skeleton: FriendCardSkeleton,
});
