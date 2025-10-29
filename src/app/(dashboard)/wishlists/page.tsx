import { requireAuth } from "@/lib/server/auth";
import { fetchDashboardData } from "@/lib/server/data-fetchers";
import { MyListsClient } from "./MyListsClient";

export default async function WishlistsPage() {
  // Require authentication - redirects to login if not authenticated
  await requireAuth();

  // Fetch dashboard data on the server
  const dashboardData = await fetchDashboardData();

  return <MyListsClient initialData={dashboardData} />;
}
