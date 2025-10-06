import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PermissionService } from "@/lib/services/PermissionService";
import { WishlistService } from "@/lib/services/WishlistService";

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

    // Get the wishlist by permalink to get the ID
    const wishlistBasic = await prisma.wishlist.findUnique({
      where: { permalink },
      select: { id: true, privacy: true, ownerId: true },
    });

    if (!wishlistBasic) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    // Check permissions if user is authenticated
    if (viewerId) {
      const permissionService = PermissionService.getInstance();
      const hasReadPermission = await permissionService.hasPermission(
        { userId: viewerId, wishlistId: wishlistBasic.id },
        "wishlists:read"
      );

      if (!hasReadPermission) {
        return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
      }
    } else {
      // For unauthenticated users, only allow public wishlists
      if (wishlistBasic.privacy !== "PUBLIC") {
        return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
      }
    }

    // Get the full wishlist data
    const wishlist = await WishlistService.getInstance().getWishlistByPermalink(
      permalink,
      viewerId
    );

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error("Error fetching public wishlist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
