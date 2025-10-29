import { getServerSession } from "@/lib/server/auth";
import { DashboardLayoutClient } from "./DashboardLayoutClient";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Get the current user session on the server
  const session = await getServerSession();

  if (!session?.user) {
    // This should not happen due to middleware, but handle gracefully
    return <div>Please log in to access the dashboard.</div>;
  }

  return <DashboardLayoutClient user={session.user}>{children}</DashboardLayoutClient>;
}
