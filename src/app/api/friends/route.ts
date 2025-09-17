import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;

    // Get all friends for the current user
    const friends = await prisma.friendship.findMany({
      where: {
        userId: currentUserId,
      },
      select: {
        friend: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    const friendsData = friends.map(({ friend }) => ({
      id: friend.id,
      name: friend.name || friend.email,
      email: friend.email,
      image: friend.image,
    }));

    return NextResponse.json(friendsData);
  } catch (error) {
    console.error("Error fetching friends:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
