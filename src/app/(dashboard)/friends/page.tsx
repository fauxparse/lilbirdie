import { FriendRequests } from "@/components/FriendRequests";
import { FriendsList } from "@/components/FriendsList";
import { requireAuth } from "@/lib/server/auth";
import { fetchFriendsData } from "@/lib/server/data-fetchers";

export default async function FriendsPage() {
  // Require authentication - redirects to login if not authenticated
  await requireAuth();

  // Fetch friends data on the server
  const friendsData = await fetchFriendsData();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-1">
        <FriendRequests initialData={friendsData.friendRequests} />
        <FriendsList initialData={friendsData.friends} />
      </div>
    </div>
  );
}
