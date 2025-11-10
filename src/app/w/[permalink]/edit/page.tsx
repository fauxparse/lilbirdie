import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server/auth";

/**
 * This page redirects to /w/[permalink] with a query parameter.
 * The wishlist page will detect the parameter and open the modal.
 * This ensures the wishlist page loads first, then the modal opens on top.
 *
 * We check auth on the server to prevent race conditions with client-side auth state.
 */
export default async function EditWishlistPage({
  params,
}: {
  params: Promise<{ permalink: string }>;
}) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  const { permalink } = await params;

  // Redirect to wishlist page with query param to trigger modal
  redirect(`/w/${permalink}?openModal=edit`);
}
