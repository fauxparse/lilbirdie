import { FriendRequests } from "@/components/FriendRequests";
import { FriendsList } from "@/components/FriendsList";

export default function FriendsPage() {
  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Friends</h1>
        <p className="text-muted-foreground">Manage your friend connections and requests</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <FriendRequests />
        <FriendsList />
      </div>
    </div>
  );
}
