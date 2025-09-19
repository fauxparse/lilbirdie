"use client";

import { UserMinus, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { AddFriendModal } from "@/components/AddFriendModal";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/Modal";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useFriends, useRemoveFriend } from "@/hooks/useFriends";

export function FriendsList() {
  // Add friend dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Remove friend confirmation state
  const [friendToRemove, setFriendToRemove] = useState<{ id: string; name: string } | null>(null);

  // React Query hooks
  const { data: friends, isLoading: loading } = useFriends();
  const removeFriendMutation = useRemoveFriend();

  const handleRemoveFriend = (friend: { id: string; name: string }) => {
    setFriendToRemove(friend);
  };

  const confirmRemoveFriend = () => {
    if (friendToRemove) {
      removeFriendMutation.mutate(friendToRemove.id);
      setFriendToRemove(null);
    }
  };

  if (loading || !friends) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Friends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading friends...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Friends
            {friends.length > 0 && (
              <span className="bg-secondary text-secondary-foreground text-xs rounded-full px-2 py-1">
                {friends.length}
              </span>
            )}
          </CardTitle>
          <Button size="small" variant="outline" onClick={() => setShowAddDialog(true)}>
            <UserPlus className="h-4 w-4 mr-1" />
            Add Friend
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {friends.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">No friends yet</p>
            <Button size="small" onClick={() => setShowAddDialog(true)}>
              <UserPlus className="h-4 w-4 mr-1" />
              Add Your First Friend
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map((friend) => {
              const isRemoving = removeFriendMutation.isPending;
              return (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar user={friend} size="default" />
                    <div>
                      <p className="font-medium">{friend.name}</p>
                    </div>
                  </div>
                  <Button
                    size="small"
                    variant="ghost"
                    disabled={isRemoving}
                    onClick={() => handleRemoveFriend({ id: friend.id, name: friend.name })}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <AddFriendModal isOpen={showAddDialog} onClose={() => setShowAddDialog(false)} />

      {/* Remove Friend Confirmation Modal */}
      <ConfirmModal
        isOpen={!!friendToRemove}
        onClose={() => setFriendToRemove(null)}
        onConfirm={confirmRemoveFriend}
        title="Remove Friend"
        description={`Are you sure you want to remove ${friendToRemove?.name} from your friends list? They will no longer be able to see your friends-only wishlists.`}
        confirmText="Remove Friend"
        cancelText="Cancel"
        variant="destructive"
      />
    </Card>
  );
}
