import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
    }

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const currentUserEmail = session.user.email;

    // Search for users by name or email, excluding the current user
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        image: true,
        // Note: email is selected for internal friendship status checking only
        email: true,
      },
      take: 10,
    });

    // For each user, determine the friendship status
    const userResults = await Promise.all(
      users.map(async (user) => {
        // Check if already friends
        const friendship = await prisma.friendship.findFirst({
          where: {
            userId: currentUserId,
            friendId: user.id,
          },
        });

        if (friendship) {
          return {
            id: user.id,
            name: user.name,
            image: user.image,
            friendshipStatus: "friends" as const,
          };
        }

        // Check for sent request (using email internally only)
        const sentRequest = await prisma.friendRequest.findFirst({
          where: {
            requesterId: currentUserId,
            email: user.email,
            status: "PENDING",
          },
        });

        if (sentRequest) {
          return {
            id: user.id,
            name: user.name,
            image: user.image,
            friendshipStatus: "pending_sent" as const,
          };
        }

        // Check for received request (using email internally only)
        const receivedRequest = await prisma.friendRequest.findFirst({
          where: {
            requesterId: user.id,
            email: currentUserEmail,
            status: "PENDING",
          },
        });

        if (receivedRequest) {
          return {
            id: user.id,
            name: user.name,
            image: user.image,
            friendshipStatus: "pending_received" as const,
          };
        }

        return {
          id: user.id,
          name: user.name,
          image: user.image,
          friendshipStatus: "none" as const,
        };
      })
    );

    return NextResponse.json(userResults);
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
