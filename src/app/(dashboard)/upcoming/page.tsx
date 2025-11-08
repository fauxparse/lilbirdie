import { requireAuth } from "@/lib/server/auth";
import { fetchDashboardData } from "@/lib/server/data-fetchers";
import { Upcoming } from "@/views/Dashboard/Upcoming";

export default async function UpcomingPage() {
  // Require authentication - redirects to login if not authenticated
  await requireAuth();

  // Fetch dashboard data on the server
  const dashboardData = await fetchDashboardData();

  return <Upcoming initialData={dashboardData} />;
}
