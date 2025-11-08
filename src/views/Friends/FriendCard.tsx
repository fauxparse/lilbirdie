import type { Route } from "next";
import Link from "next/link";
import { ProfileCard } from "@/components/ui/ProfileCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { Friend } from "@/hooks/useFriends";

interface FriendCardProps {
  friend: Friend;
}

export const FriendCard: React.FC<FriendCardProps> = ({ friend }: FriendCardProps) => (
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
