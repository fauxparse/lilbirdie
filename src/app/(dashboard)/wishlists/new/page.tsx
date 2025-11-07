import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server/auth";

/**
 * This page redirects to /wishlists with a query parameter.
 * The wishlists page will detect the parameter and open the modal.
 * This ensures the wishlists page loads first, then the modal opens on top.
 *
 * We check auth on the server to prevent race conditions with client-side auth state.
 */
export default async function NewWishlistPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Redirect to wishlists page with query param to trigger modal
  redirect("/wishlists?openModal=new");
}
