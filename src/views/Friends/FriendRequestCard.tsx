import { formatDistanceToNow } from "date-fns";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProfileCard } from "@/components/ui/ProfileCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { FriendRequest } from "@/hooks/useFriends";

interface FriendRequestCardProps {
  friendRequest: FriendRequest;
  isProcessing?: boolean;
  onAccept?: () => void;
  onIgnore?: () => void;
  onCancel?: () => void;
}

export function FriendRequestCard({
  friendRequest,
  isProcessing = false,
  onAccept,
  onIgnore,
  onCancel,
}: FriendRequestCardProps) {
  return (
    <ProfileCard
      avatar={
        <UserAvatar
          className="w-17 h-17"
          user={friendRequest.type === "incoming" ? friendRequest.requester : null}
          size="huge"
        />
      }
      primaryText={
        <div className="text-small font-medium truncate">
          {friendRequest.type === "incoming" ? friendRequest.requester?.name : friendRequest.email}
        </div>
      }
      secondaryText={
        <div className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(friendRequest.createdAt), { addSuffix: true })}
        </div>
      }
      actions={
        friendRequest.type === "incoming" ? (
          <>
            <Button size="x-small" disabled={isProcessing} onClick={onAccept}>
              <Check className="h-4 w-4" />
              <span>Accept</span>
            </Button>
            <Button size="x-small" variant="outline" disabled={isProcessing} onClick={onIgnore}>
              <X className="h-4 w-4" />
              <span>Ignore</span>
            </Button>
          </>
        ) : (
          <Button size="x-small" variant="outline" disabled={isProcessing} onClick={onCancel}>
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </Button>
        )
      }
    />
  );
}
