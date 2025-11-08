import { requireAuth } from "@/lib/server/auth";
import { fetchDashboardData } from "@/lib/server/data-fetchers";
import { MyLists } from "@/views/Dashboard/MyLists";

export default async function WishlistsPage() {
  // Require authentication - redirects to login if not authenticated
  await requireAuth();

  // Fetch dashboard data on the server
  const dashboardData = await fetchDashboardData();

  return <MyLists initialData={dashboardData} />;
}
