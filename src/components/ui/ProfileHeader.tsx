import { Clock, MoreHorizontal, UserRoundMinus, UserRoundPlus } from "lucide-react";
import type React from "react";
import { useFriendshipActions } from "@/hooks/useFriendshipActions";
import type { UserProfileData } from "@/lib/server/data-fetchers";
import { Button } from "./Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./DropdownMenu";
import { UserAvatar } from "./UserAvatar";

interface ProfileHeaderProps {
  profile: UserProfileData;
  title?: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * ProfileHeader - Common header component for profile pages
 *
 * Features:
 * - Centered user avatar (huge size)
 * - Centered title (defaults to user name, supports ReactNode for custom content)
 * - Optional breadcrumbs slot (rendered with border-t separator)
 * - Optional children for additional content (e.g., tabs, actions)
 * - Friendship actions dropdown (add/remove friend) for non-own profiles
 *
 * Used by:
 * - Dashboard layout (with tabs navigation)
 * - User profile page (simple border only)
 * - Wishlist pages (with custom title, breadcrumbs, and actions)
 */
export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  title,
  description,
  breadcrumbs,
  children,
}) => {
  const { user, friendshipStatus, isOwnProfile } = profile;
  const { addFriend, removeFriend } = useFriendshipActions(user.id);
  const displayTitle = title || user.name || user.email || "Profile";

  return (
    <div>
      {breadcrumbs && <div className="">{breadcrumbs}</div>}

      <div className="flex flex-col items-center gap-4">
        <div className="grid">
          <UserAvatar user={user} size="huge" className="row-1 col-1" />
          {!isOwnProfile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon-small"
                  className="row-1 col-1 relative z-1 rounded-full ring-2 ring-background focus-visible:ring-background focus-visible:ring-offset-0 self-end justify-self-end -m-2"
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <FriendshipMenuContent
                  friendshipStatus={friendshipStatus}
                  onAddFriend={addFriend}
                  onRemoveFriend={removeFriend}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="mb-6 flex flex-col items-center gap-0">
          <div className="text-3xl md:text-5xl font-medium text-center font-heading">
            {displayTitle}
          </div>
          {description && (
            <div className="text-muted-foreground text-center text-balance max-w-[60cqw]">
              {description}
            </div>
          )}
        </div>
      </div>

      {children}
    </div>
  );
};

interface FriendshipMenuContentProps {
  friendshipStatus: "friends" | "none" | "pending_sent" | "pending_received";
  onAddFriend: () => void;
  onRemoveFriend: () => void;
}

const FriendshipMenuContent: React.FC<FriendshipMenuContentProps> = ({
  friendshipStatus,
  onAddFriend,
  onRemoveFriend,
}) => {
  switch (friendshipStatus) {
    case "friends":
      return (
        <DropdownMenuItem
          onClick={onRemoveFriend}
          className="text-destructive focus:text-destructive"
        >
          <UserRoundMinus className="h-4 w-4 mr-2" />
          Remove Friend
        </DropdownMenuItem>
      );

    case "pending_sent":
    case "pending_received":
      return (
        <DropdownMenuItem disabled>
          <Clock className="h-4 w-4" />
          {friendshipStatus === "pending_sent" ? "Request sent" : "Request received"}
        </DropdownMenuItem>
      );

    default:
      return (
        <DropdownMenuItem onClick={onAddFriend}>
          <UserRoundPlus className="h-4 w-4" />
          Add friend
        </DropdownMenuItem>
      );
  }
};
