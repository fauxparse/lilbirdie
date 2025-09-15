import { auth } from "@/lib/auth";
import { WishlistService } from "@/lib/services/WishlistService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ permalink: string }> }
) {
  try {
    const { permalink } = await params;

    // Get the session (optional for public wishlists)
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const viewerId = session?.user?.id;

    // Get the wishlist by permalink
    const wishlist = await WishlistService.getInstance().getWishlistByPermalink(
      permalink,
      viewerId
    );

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    // Check if the wishlist is accessible
    if (wishlist.privacy === "PRIVATE" && wishlist.ownerId !== viewerId) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    if (wishlist.privacy === "FRIENDS_ONLY" && wishlist.ownerId !== viewerId) {
      // TODO: Check if viewer is friends with owner
      // For now, allow access (friends system not implemented yet)
    }

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error("Error fetching public wishlist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
