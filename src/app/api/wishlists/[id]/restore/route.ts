import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { WishlistService } from "@/lib/services/WishlistService";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: wishlistId } = await params;
    if (!wishlistId) {
      return NextResponse.json({ error: "Wishlist ID required" }, { status: 400 });
    }

    const wishlistService = WishlistService.getInstance();

    // Restore the wishlist
    const restoredWishlist = await wishlistService.restoreWishlist(wishlistId, session.user.id);

    return NextResponse.json({
      id: restoredWishlist.id,
      title: restoredWishlist.title,
      permalink: restoredWishlist.permalink,
      restoredAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error restoring wishlist:", error);

    if (error instanceof Error) {
      if (error.message === "Deleted wishlist not found") {
        return NextResponse.json(
          { error: "Wishlist not found or already restored" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ error: "Failed to restore wishlist" }, { status: 500 });
  }
}
