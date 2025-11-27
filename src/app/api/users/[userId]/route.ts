import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PrivacyService } from "@/lib/services/PrivacyService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Get the session (optional for public profiles)
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const viewerId = session?.user?.id;

    // Get the user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        profile: {
          select: {
            birthday: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if current user is friends with this user
    let friendshipStatus: "none" | "friends" | "pending_sent" | "pending_received" = "none";

    if (viewerId && viewerId !== userId) {
      // Check for existing friendship
      const friendship = await prisma.friendship.findFirst({
        where: {
          userId: viewerId,
          friendId: userId,
        },
      });

      if (friendship) {
        friendshipStatus = "friends";
      } else {
        // Check for pending friend requests
        const sentRequest = await prisma.friendRequest.findFirst({
          where: {
            requesterId: viewerId,
            email: user.email,
            status: "PENDING",
          },
        });

        const receivedRequest = await prisma.friendRequest.findFirst({
          where: {
            requesterId: userId,
            email: session?.user?.email,
            status: "PENDING",
          },
        });

        if (sentRequest) {
          friendshipStatus = "pending_sent";
        } else if (receivedRequest) {
          friendshipStatus = "pending_received";
        }
      }
    }

    // Check if viewer is admin - admins can view all wishlists
    let isViewerAdmin = false;
    if (viewerId) {
      const viewer = await prisma.user.findUnique({
        where: { id: viewerId },
        select: { admin: true },
      });
      isViewerAdmin = viewer?.admin ?? false;
    }

    // Get visible wishlists based on relationship
    let whereClause: Prisma.WishlistWhereInput = {
      ownerId: userId,
      privacy: "PUBLIC",
    };

    if (viewerId === userId) {
      // User viewing their own profile - show all wishlists
      whereClause = { ownerId: userId };
    } else if (isViewerAdmin) {
      // Admins can see all wishlists regardless of privacy
      whereClause = { ownerId: userId };
    } else if (friendshipStatus === "friends") {
      // Friends can see public and friends_only wishlists
      whereClause = {
        ownerId: userId,
        privacy: { in: ["PUBLIC", "FRIENDS_ONLY"] },
      };
    }

    const wishlists = await prisma.wishlist.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        permalink: true,
        privacy: true,
        isDefault: true,
        createdAt: true,
        _count: {
          select: {
            items: {
              where: { isDeleted: false },
            },
          },
        },
        items: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            name: true,
            imageUrl: true,
            blurhash: true,
          },
          take: 4,
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    // Apply privacy redaction if not a friend, self, or admin
    const privacyService = PrivacyService.getInstance();
    const isFriendOrSelfOrAdmin = viewerId === userId || friendshipStatus === "friends" || isViewerAdmin;
    const redactedUser = privacyService.redactUserData(user, isFriendOrSelfOrAdmin);

    return NextResponse.json({
      user: redactedUser,
      friendshipStatus,
      wishlists: wishlists.map((wishlist) => ({
        ...wishlist,
        items: wishlist.items.map((item) => ({
          id: item.id,
          name: item.name,
          imageUrl: item.imageUrl || undefined,
          imageBlurhash: item.blurhash || undefined,
        })),
      })),
      isOwnProfile: viewerId === userId,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
