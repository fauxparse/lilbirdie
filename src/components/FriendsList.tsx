"use client";

import { UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { AddFriendModal } from "@/components/AddFriendModal";
import { FriendCard } from "@/components/FriendCard";
import { Button } from "@/components/ui/Button";
import { useFriends } from "@/hooks/useFriends";

interface FriendsListProps {
  initialData: Array<{
    id: string;
    name: string;
    email: string;
    image?: string;
    visibleWishlistCount: number;
  }>;
}

export function FriendsList({ initialData }: FriendsListProps) {
  // Add friend dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);

  // React Query hooks - use server data as initial data
  const { data: friends = initialData } = useFriends(initialData);

  return (
    <>
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
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] xl:grid-cols-[1fr_1fr_280px] gap-3 md:gap-x-6 md:auto-rows-min">
          <button
            type="button"
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground md:col-start-2 md:row-start-1 xl:col-start-3"
          >
            <div className="h-10 w-10 rounded-full border-2 border-dashed border-border flex items-center justify-center shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="text-base font-medium">Add a friend</div>
          </button>
          <div className="contents md:col-start-1 xl:col-span-2 xl:grid xl:grid-cols-2 xl:gap-3">
            {friends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        </div>
      )}

      <AddFriendModal isOpen={showAddDialog} onClose={() => setShowAddDialog(false)} />
    </>
  );
}
