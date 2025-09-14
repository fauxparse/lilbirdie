import { auth } from "@/lib/auth";
import { WishlistItemService } from "@/lib/services/WishlistItemService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const items = await WishlistItemService.getItemsByWishlistId(id, session?.user?.id);

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

    const body = await request.json();
    const { name, description, url, imageUrl, price, currency, priority, tags } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const item = await WishlistItemService.createItem(id, session.user.id, {
      name: name.trim(),
      description: description?.trim(),
      url: url?.trim(),
      imageUrl: imageUrl?.trim(),
      price: price ? Number(price) : undefined,
      currency: currency || "USD",
      priority: priority ? Number(priority) : 0,
      tags: tags || [],
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
