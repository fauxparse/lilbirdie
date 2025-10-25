import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PartyKitEventEmitter } from "@/lib/partykit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const body = (await request.json()) as { action?: string };
    const { action } = body;

    if (!action || !["accept", "ignore"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const currentUserEmail = session.user.email;

    // Get the friend request
    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        id: requestId,
        email: currentUserEmail,
        status: "PENDING",
      },
      include: {
        requester: true,
      },
    });

    if (!friendRequest) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 });
    }

    if (action === "accept") {
      // Create mutual friendships in a transaction
      const friendship = await prisma.$transaction(async (tx) => {
        // Update the friend request status
        await tx.friendRequest.update({
          where: { id: requestId },
          data: {
            status: "ACCEPTED",
            receiverId: currentUserId,
          },
        });

        // Create friendship from requester to receiver
        const friendship1 = await tx.friendship.create({
          data: {
            userId: friendRequest.requesterId,
            friendId: currentUserId,
          },
        });

        // Create friendship from receiver to requester
        await tx.friendship.create({
          data: {
            userId: currentUserId,
            friendId: friendRequest.requesterId,
          },
        });

        return friendship1;
      });

      // Emit real-time events to notify both users about the new friendship
      await PartyKitEventEmitter.emitToUser(friendRequest.requesterId, "friend:accepted", {
        friendshipId: friendship.id,
        userId: currentUserId,
      });
      await PartyKitEventEmitter.emitToUser(currentUserId, "friend:accepted", {
        friendshipId: friendship.id,
        userId: friendRequest.requesterId,
      });

      return NextResponse.json({
        success: true,
        message: "Friend request accepted",
      });
    } else if (action === "ignore") {
      // Update the friend request status to ignored
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: {
          status: "IGNORED",
          receiverId: currentUserId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Friend request ignored",
      });
    }
  } catch (error) {
    console.error("Error handling friend request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
