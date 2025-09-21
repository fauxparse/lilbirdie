import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SocketEventEmitter } from "@/lib/socket";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ permalink: string; itemId: string }> }
) {
  try {
    const { permalink, itemId } = await params;

    // Get the session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the wishlist item to verify it exists and get owner info
    const item = await prisma.wishlistItem.findFirst({
      where: {
        id: itemId,
        wishlist: {
          permalink,
        },
        isDeleted: false,
      },
      include: {
        wishlist: {
          select: {
            id: true,
            ownerId: true,
            privacy: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check if user can access this wishlist
    if (item.wishlist.privacy === "PRIVATE" && item.wishlist.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Prevent owner from claiming their own items
    if (item.wishlist.ownerId === session.user.id) {
      return NextResponse.json({ error: "Cannot claim your own items" }, { status: 400 });
    }

    // Check if already claimed by this user
    const existingClaim = await prisma.claim.findUnique({
      where: {
        itemId_userId: {
          itemId,
          userId: session.user.id,
        },
      },
    });

    if (existingClaim) {
      return NextResponse.json({ error: "Already claimed" }, { status: 400 });
    }

    // Create the claim
    const claim = await prisma.claim.create({
      data: {
        userId: session.user.id,
        itemId,
        wishlistId: item.wishlist.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Emit real-time event for claim created
    SocketEventEmitter.emitToWishlist(item.wishlist.id, "claim:created", {
      claim,
    });

    return NextResponse.json({ success: true, claim });
  } catch (error) {
    console.error("Error claiming item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ permalink: string; itemId: string }> }
) {
  try {
    const { permalink, itemId } = await params;

    // Get the session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the wishlist item to verify it exists
    const item = await prisma.wishlistItem.findFirst({
      where: {
        id: itemId,
        wishlist: {
          permalink,
        },
        isDeleted: false,
      },
      include: {
        wishlist: {
          select: {
            id: true,
            ownerId: true,
            privacy: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check if user can access this wishlist
    if (item.wishlist.privacy === "PRIVATE" && item.wishlist.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get the claim first to return user info
    const existingClaim = await prisma.claim.findFirst({
      where: {
        userId: session.user.id,
        itemId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!existingClaim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Remove the claim
    await prisma.claim.delete({
      where: {
        id: existingClaim.id,
      },
    });

    // Emit real-time event for claim removed
    SocketEventEmitter.emitToWishlist(item.wishlist.id, "claim:removed", {
      itemId,
      wishlistId: item.wishlist.id,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true, claim: existingClaim });
  } catch (error) {
    console.error("Error unclaiming item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
