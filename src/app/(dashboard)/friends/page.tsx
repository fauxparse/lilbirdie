import { requireAuth } from "@/lib/server/auth";
import { fetchFriendsData } from "@/lib/server/data-fetchers";
import { Friends } from "@/views/Dashboard/Friends";

export default async function FriendsPage() {
  // Require authentication - redirects to login if not authenticated
  await requireAuth();

  // Fetch friends data on the server
  const friendsData = await fetchFriendsData();

  return (
    <div className="@container">
      <Friends initialData={friendsData} />
    </div>
  );
}
