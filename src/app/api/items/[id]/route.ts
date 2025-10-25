import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PartyKitEventEmitter } from "@/lib/partykit";
import { PermissionService } from "@/lib/services/PermissionService";
import { WishlistItemService } from "@/lib/services/WishlistItemService";
import type { UpdateWishlistItemData } from "@/types";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const item = await WishlistItemService.getInstance().getItemById(id, session?.user?.id);

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching item:", error);

    if (error instanceof Error && error.message === "Item not found") {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get wishlistId for permission check
    const item = await prisma.wishlistItem.findUnique({
      where: { id },
      select: { wishlistId: true, isDeleted: true },
    });

    if (!item || item.isDeleted) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check permissions using PermissionService
    const permissionService = PermissionService.getInstance();
    const canWrite = await permissionService.hasPermission(
      { userId: session.user.id, wishlistId: item.wishlistId },
      "items:write"
    );

    if (!canWrite) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
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

    const updateData: UpdateWishlistItemData = {};

    if (name !== undefined) {
      if (name.trim() === "") {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) updateData.description = description?.trim();
    if (url !== undefined) updateData.url = url?.trim();
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl?.trim();
    if (price !== undefined) updateData.price = price ? Number(price) : undefined;
    if (currency !== undefined) updateData.currency = currency;
    if (priority !== undefined) updateData.priority = Number(priority);
    if (tags !== undefined) updateData.tags = tags;

    const updatedItem = await WishlistItemService.getInstance().updateItem(
      id,
      session.user.id,
      updateData
    );

    // Emit real-time event for wishlist item updated
    await PartyKitEventEmitter.emitToWishlist(updatedItem.wishlistId, "wishlist:item:updated", {
      itemId: updatedItem.id,
      wishlistId: updatedItem.wishlistId,
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating item:", error);

    if (error instanceof Error) {
      if (error.message === "Item not found") {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
      if (error.message === "Access denied") {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get wishlistId for permission check
    const item = await prisma.wishlistItem.findUnique({
      where: { id },
      select: { wishlistId: true, isDeleted: true },
    });

    if (!item || item.isDeleted) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check permissions using PermissionService
    const permissionService = PermissionService.getInstance();
    const canDelete = await permissionService.hasPermission(
      { userId: session.user.id, wishlistId: item.wishlistId },
      "items:delete"
    );

    if (!canDelete) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await WishlistItemService.getInstance().deleteItem(id, session.user.id);

    // Emit real-time event for wishlist item deleted
    await PartyKitEventEmitter.emitToWishlist(item.wishlistId, "wishlist:item:deleted", {
      itemId: id,
      wishlistId: item.wishlistId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting item:", error);

    if (error instanceof Error) {
      if (error.message === "Item not found") {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
      if (error.message === "Access denied") {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
