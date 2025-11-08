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
    const friendships = await prisma.friendship.findMany({
      where: {
        userId: currentUserId,
      },
      select: {
        friend: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    const friends = friendships.map((f) => f.friend);

    // Get visible wishlist counts for each friend
    const friendsWithCounts = await Promise.all(
      friends.map(async (friend) => {
        const visibleWishlistCount = await prisma.wishlist.count({
          where: {
            ownerId: friend.id,
            isDeleted: false,
            privacy: {
              in: ["PUBLIC", "FRIENDS_ONLY"],
            },
          },
        });

        return {
          id: friend.id,
          name: friend.name || "Anonymous User",
          image: friend.image,
          visibleWishlistCount,
        };
      })
    );

    return NextResponse.json(friendsWithCounts);
  } catch (error) {
    console.error("Error fetching friends:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
