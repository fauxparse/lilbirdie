import { requireAuth } from "@/lib/server/auth";
import { fetchDashboardData } from "@/lib/server/data-fetchers";
import { UpcomingClient } from "./UpcomingClient";

export default async function UpcomingPage() {
  // Require authentication - redirects to login if not authenticated
  await requireAuth();

  // Fetch dashboard data on the server
  const dashboardData = await fetchDashboardData();

  return <UpcomingClient initialData={dashboardData} />;
}
