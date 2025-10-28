import { requireAuth } from "@/lib/server/auth";
import { fetchDashboardData } from "@/lib/server/data-fetchers";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  // Require authentication - redirects to login if not authenticated
  await requireAuth();

  // Fetch dashboard data on the server
  const dashboardData = await fetchDashboardData();

  return <DashboardClient initialData={dashboardData} />;
}
