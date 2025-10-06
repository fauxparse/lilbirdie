import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { WishlistItemService } from "@/lib/services/WishlistItemService";
import { SocketEventEmitter } from "@/lib/socket";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: itemId } = await params;
    if (!itemId) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 });
    }

    const wishlistItemService = WishlistItemService.getInstance();

    // Restore the item
    const restoredItem = await wishlistItemService.restoreItem(itemId, session.user.id);

    // Emit real-time event
    SocketEventEmitter.emitToWishlist(restoredItem.wishlistId, "wishlist:item:added", {
      item: restoredItem,
      wishlistId: restoredItem.wishlistId,
    });

    return NextResponse.json({
      id: restoredItem.id,
      name: restoredItem.name,
      wishlistId: restoredItem.wishlistId,
      restoredAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error restoring item:", error);

    if (error instanceof Error) {
      if (error.message === "Deleted item not found") {
        return NextResponse.json({ error: "Item not found or already restored" }, { status: 404 });
      }
      if (error.message === "Access denied") {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    return NextResponse.json({ error: "Failed to restore item" }, { status: 500 });
  }
}
