"use client";

import { useState } from "react";
import { AddFriendModal } from "@/components/AddFriendModal";
import { useFriends } from "@/hooks/useFriends";
import type { FriendsData } from "@/lib/server/data-fetchers";
import { FriendRequests } from "@/views/Friends/FriendRequests";
import { FriendCard } from "../Friends/FriendCard";

interface FriendsProps {
  initialData: FriendsData;
}

export function Friends({ initialData }: FriendsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { data: friends } = useFriends(initialData.friends);

  return (
    <div className="grid grid-cols-1 @2xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4 gap-4">
      <FriendRequests
        initialData={initialData.friendRequests}
        onAddFriend={() => setShowAddDialog(true)}
      />
      {friends?.map((friend) => (
        <FriendCard key={friend.id} friend={friend} />
      ))}
      <AddFriendModal isOpen={showAddDialog} onClose={() => setShowAddDialog(false)} />
    </div>
  );

  // if (friends.length === 0) {
  //   return (
  //     <>
  //       <div className="space-y-6">
  //         <FriendRequests
  //           initialData={initialData.friendRequests}
  //           onAddFriend={() => setShowAddDialog(true)}
  //         />
  //         <div className="text-center py-8">
  //           <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
  //           <p className="text-sm text-muted-foreground mb-4">No friends yet</p>
  //           <Button size="small" onClick={() => setShowAddDialog(true)}>
  //             <UserPlus className="h-4 w-4 mr-1" />
  //             Add Your First Friend
  //           </Button>
  //         </div>
  //       </div>
  //       <AddFriendModal isOpen={showAddDialog} onClose={() => setShowAddDialog(false)} />
  //     </>
  //   );
  // }

  // return (
  //   <>
  //     <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] xl:grid-cols-[1fr_1fr_280px] gap-6">
  //       {/* Left column(s) - Friends list */}
  //       <div className="md:col-start-1 xl:col-span-2 space-y-3 xl:space-y-0 xl:grid xl:grid-cols-2 xl:gap-3 md:order-2">
  //         {friends.map((friend) => (
  //           <FriendCard key={friend.id} friend={friend} />
  //         ))}
  //       </div>

  //       {/* Right column - Friend requests and Add button */}
  //       <div className="md:col-start-2 md:row-start-1 xl:col-start-3 md:order-1">
  //         <FriendRequests
  //           initialData={initialData.friendRequests}
  //           onAddFriend={() => setShowAddDialog(true)}
  //         />
  //       </div>
  //     </div>

  //     <AddFriendModal isOpen={showAddDialog} onClose={() => setShowAddDialog(false)} />
  //   </>
  // );
}
