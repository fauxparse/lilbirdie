import Link from "next/link";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface FriendCardProps {
  friend: {
    id: string;
    name: string;
    image?: string;
    visibleWishlistCount: number;
  };
}

export function FriendCard({ friend }: FriendCardProps) {
  return (
    <Link
      href={`/u/${friend.id}`}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group/friend"
    >
      <UserAvatar user={friend} size="large" />
      <div className="flex-1 min-w-0">
        <div className="text-base font-medium truncate">{friend.name}</div>
        <div className="text-sm text-muted-foreground">
          {friend.visibleWishlistCount} list{friend.visibleWishlistCount !== 1 ? "s" : ""}
        </div>
      </div>
    </Link>
  );
}
