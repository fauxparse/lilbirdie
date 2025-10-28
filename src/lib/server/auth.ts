import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Get the current user session on the server side
 * @returns The user session or null if not authenticated
 */
export async function getServerSession() {
  const headersList = await headers();

  try {
    const session = await auth.api.getSession({
      headers: headersList,
    });

    return session;
  } catch (error) {
    console.error("Error getting server session:", error);
    return null;
  }
}

/**
 * Get the current user session and redirect if not authenticated
 * @param redirectTo - The path to redirect to if not authenticated (default: "/login")
 * @returns The user session
 */
export async function requireAuth(redirectTo: string = "/login") {
  const session = await getServerSession();

  if (!session?.user) {
    (redirect as (path: string) => never)(redirectTo);
  }

  return session;
}

/**
 * Get the current user ID and redirect if not authenticated
 * @param redirectTo - The path to redirect to if not authenticated (default: "/login")
 * @returns The user ID
 */
export async function requireUserId(redirectTo: string = "/login") {
  const session = await requireAuth(redirectTo);
  if (!session?.user) {
    throw new Error("User not authenticated");
  }
  return session.user.id;
}
