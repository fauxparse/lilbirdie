import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Get the session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;

    if (currentUserId === userId) {
      return NextResponse.json({ error: "Cannot add yourself as a friend" }, { status: 400 });
    }

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already friends
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        userId: currentUserId,
        friendId: userId,
      },
    });

    if (existingFriendship) {
      return NextResponse.json({ error: "Already friends" }, { status: 400 });
    }

    // Check if friend request already exists
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        requesterId: currentUserId,
        email: targetUser.email,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json({ error: "Friend request already sent" }, { status: 400 });
    }

    // Create friend request
    const friendRequest = await prisma.friendRequest.create({
      data: {
        email: targetUser.email,
        requesterId: currentUserId,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Friend request sent",
      friendRequest,
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Get the session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;

    // Remove mutual friendships
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId: currentUserId, friendId: userId },
          { userId: userId, friendId: currentUserId },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Friend removed",
    });
  } catch (error) {
    console.error("Error removing friend:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
