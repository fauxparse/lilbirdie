import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PartyKitEventEmitter } from "@/lib/partykit";
import { PermissionService } from "@/lib/services/PermissionService";
import { WishlistItemService } from "@/lib/services/WishlistItemService";
import { WishlistService } from "@/lib/services/WishlistService";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // First resolve the permalink to get the wishlist
    const wishlist = await WishlistService.getInstance().getWishlistByPermalink(
      id,
      session?.user?.id
    );

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    const items = await WishlistItemService.getInstance().getItemsByWishlistId(
      wishlist.id,
      session?.user?.id
    );

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching wishlist items:", error);

    if (error instanceof Error && error.message === "Wishlist not found") {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      url?: string;
      imageUrl?: string;
      price?: number;
      currency?: string;
      priority?: number;
      tags?: string[];
    };
    const { name, description, url, imageUrl, price, currency, priority, tags } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // First resolve the permalink to get the wishlist
    const wishlist = await WishlistService.getInstance().getWishlistByPermalink(
      id,
      session.user.id
    );

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    // Check permissions using PermissionService
    const permissionService = PermissionService.getInstance();
    const canWrite = await permissionService.hasPermission(
      { userId: session.user.id, wishlistId: wishlist.id },
      "items:write"
    );

    if (!canWrite) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const item = await WishlistItemService.getInstance().createItem(wishlist.id, session.user.id, {
      name: name.trim(),
      description: description?.trim(),
      url: url?.trim(),
      imageUrl: imageUrl?.trim(),
      price: price ? Number(price) : undefined,
      currency: currency || "USD",
      priority: priority ? Number(priority) : 0,
      tags: tags || [],
    });

    // Emit real-time event for wishlist item added
    await PartyKitEventEmitter.emitToWishlist(wishlist.id, "wishlist:item:added", {
      item,
      wishlistId: wishlist.id,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating wishlist item:", error);

    if (error instanceof Error) {
      if (error.message === "Wishlist not found or access denied") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
