import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { WishlistItemService } from "@/lib/services/WishlistItemService";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const claim = await WishlistItemService.getInstance().claimItem(id, session.user.id);

    return NextResponse.json({
      success: true,
      claim,
    });
  } catch (error) {
    console.error("Error claiming item:", error);

    if (error instanceof Error) {
      if (error.message === "Item not found") {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
      if (error.message === "Cannot claim your own item") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === "Item already claimed by you") {
        return NextResponse.json({ error: error.message }, { status: 400 });
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

    const claim = await WishlistItemService.getInstance().unclaimItem(id, session.user.id);

    return NextResponse.json({
      success: true,
      claim,
    });
  } catch (error) {
    console.error("Error unclaiming item:", error);

    if (error instanceof Error && error.message === "Claim not found") {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
