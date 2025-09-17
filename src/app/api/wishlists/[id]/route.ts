import { WishlistPrivacy } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UpdateWishlistData, WishlistService } from "@/lib/services/WishlistService";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const wishlist = await WishlistService.getInstance().getWishlistByPermalink(
      id,
      session?.user?.id
    );

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, privacy, isDefault } = body;

    const updateData: UpdateWishlistData = {};

    if (title !== undefined) {
      if (title.trim() === "") {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (privacy !== undefined) {
      if (!Object.values(WishlistPrivacy).includes(privacy)) {
        return NextResponse.json({ error: "Invalid privacy setting" }, { status: 400 });
      }
      updateData.privacy = privacy;
    }

    if (isDefault !== undefined) {
      updateData.isDefault = !!isDefault;
    }

    const wishlist = await WishlistService.getInstance().updateWishlist(
      id,
      session.user.id,
      updateData
    );

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found or access denied" }, { status: 404 });
    }

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error("Error updating wishlist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await WishlistService.getInstance().deleteWishlist(id, session.user.id);

    if (!result) {
      return NextResponse.json({ error: "Wishlist not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Cannot delete the only wishlist") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error deleting wishlist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
