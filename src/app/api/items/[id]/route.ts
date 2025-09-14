import { auth } from "@/lib/auth";
import { WishlistItemService } from "@/lib/services/WishlistItemService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const item = await WishlistItemService.getItemById(id, session?.user?.id);

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

    const body = await request.json();
    const { name, description, url, imageUrl, price, currency, priority, tags } = body;

    const updateData: any = {};

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

    const item = await WishlistItemService.updateItem(id, session.user.id, updateData);

    return NextResponse.json(item);
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

    await WishlistItemService.deleteItem(id, session.user.id);

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
