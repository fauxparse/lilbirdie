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
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Friends</h1>
        <p className="text-muted-foreground">Manage your friend connections and requests</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <FriendRequests initialData={friendsData.friendRequests} />
        <FriendsList initialData={friendsData.friends} />
      </div>
    </div>
  );
}
