import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { WishlistItemService } from "@/lib/services/WishlistItemService";
import { SocketEventEmitter } from "@/lib/socket";

interface MoveItemsRequest {
  itemIds: string[];
  targetWishlistId: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { itemIds, targetWishlistId }: MoveItemsRequest = body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: "Item IDs are required" }, { status: 400 });
    }

    if (!targetWishlistId) {
      return NextResponse.json({ error: "Target wishlist ID is required" }, { status: 400 });
    }

    const wishlistItemService = WishlistItemService.getInstance();

    // Get items before moving to emit removal events
    const itemsBeforeMove = await Promise.all(
      itemIds.map(async (itemId) => {
        try {
          const item = await wishlistItemService.getItemById(itemId, session.user.id);
          return {
            id: item.id,
            name: item.name,
            sourceWishlistId: item.wishlistId,
          };
        } catch {
          return null;
        }
      })
    );

    // Move the items
    let movedItems;
    try {
      movedItems = await wishlistItemService.moveItems(
        itemIds,
        targetWishlistId,
        session.user.id
      );
    } catch (error) {
      console.error("Error moving items:", error);

      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          return NextResponse.json({ error: error.message }, { status: 404 });
        }
        if (error.message.includes("Access denied")) {
          return NextResponse.json({ error: error.message }, { status: 403 });
        }
      }

      return NextResponse.json({ error: "Failed to move items" }, { status: 500 });
    }

    // Emit real-time events
    for (const itemBefore of itemsBeforeMove) {
      if (itemBefore && itemBefore.sourceWishlistId !== targetWishlistId) {
        // Emit removal from source wishlist
        SocketEventEmitter.emitToWishlist(itemBefore.sourceWishlistId, "wishlist:item:deleted", {
          itemId: itemBefore.id,
          wishlistId: itemBefore.sourceWishlistId,
        });
      }
    }

    // Emit addition to target wishlist for each moved item
    for (const movedItem of movedItems) {
      SocketEventEmitter.emitToWishlist(targetWishlistId, "wishlist:item:added", {
        item: movedItem,
        wishlistId: targetWishlistId,
      });
    }

    return NextResponse.json({
      success: true,
      movedItemsCount: movedItems.length,
      targetWishlistId,
      items: movedItems.map((item) => ({
        id: item.id,
        name: item.name,
        wishlistId: item.wishlistId,
        wishlistTitle: item.wishlist?.title,
      })),
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Failed to move items" }, { status: 500 });
  }
}
