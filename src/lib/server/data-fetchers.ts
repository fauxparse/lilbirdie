import { prisma } from "@/lib/db";
import { OccasionService } from "@/lib/services/OccasionService";
import { PrivacyService } from "@/lib/services/PrivacyService";
import { WishlistService } from "@/lib/services/WishlistService";
import type {
  SerializedDashboardData,
  SerializedFriendsData,
  SerializedUserProfile,
  SerializedWishlist,
  SerializedWishlistSummary,
} from "@/types/serialized";
import { getServerSession } from "./auth";

// Re-export serialized types for convenience
export type DashboardData = SerializedDashboardData;
export type WishlistData = SerializedWishlistSummary;
export type UserProfileData = SerializedUserProfile;
export type FriendsData = SerializedFriendsData;

/**
 * Fetch dashboard data for the current user
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  const session = await getServerSession();
  if (!session?.user) {
    throw new Error("User not authenticated");
  }

  const currentUserId = session.user.id;

  // Get user's wishlists with first 4 items for preview
  const wishlists = await prisma.wishlist.findMany({
    where: {
      ownerId: currentUserId,
    },
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
          items: true,
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

  // Get user's friends with their claims in one optimized query
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
          profile: {
            select: {
              birthday: true,
            },
          },
        },
      },
    },
  });

  // Get all claims for friends' wishlists in one query to avoid N+1
  const friendIds = friends.map((f) => f.friend.id);
  const claimsForFriends = await prisma.claim.findMany({
    where: {
      userId: currentUserId,
      wishlist: {
        ownerId: { in: friendIds },
      },
    },
    select: {
      wishlist: {
        select: {
          ownerId: true,
        },
      },
      createdAt: true,
    },
  });

  // Create a map of friend ID to their latest claim date
  const friendClaimsMap = new Map<string, Date>();
  for (const claim of claimsForFriends) {
    const friendId = claim.wishlist.ownerId;
    const existingDate = friendClaimsMap.get(friendId);
    if (!existingDate || claim.createdAt > existingDate) {
      friendClaimsMap.set(friendId, claim.createdAt);
    }
  }

  // Get upcoming occasions using OccasionService
  const currentDate = new Date();
  const upcomingOccasions = [];
  const occasionService = OccasionService.getInstance();

  for (const { friend } of friends) {
    // Get friend's upcoming occasions (next 4 months for ~120 day window)
    const occasions = await occasionService.getUpcomingOccasions(friend.id, 4);

    for (const occasion of occasions) {
      if (!occasion.nextOccurrence) continue;

      // Calculate days until occasion
      const daysUntil = Math.ceil(
        (occasion.nextOccurrence.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Get wishlist permalink - either from occasion entity or default wishlist
      let wishlistPermalink: string | null = null;

      if (occasion.entityType === "WISHLIST" && occasion.entityId) {
        // Get the specific wishlist associated with this occasion
        const wishlist = await prisma.wishlist.findUnique({
          where: { id: occasion.entityId },
          select: { permalink: true },
        });
        wishlistPermalink = wishlist?.permalink || null;
      }

      // Fallback to default wishlist if no occasion-specific wishlist
      if (!wishlistPermalink) {
        const defaultWishlist = await prisma.wishlist.findFirst({
          where: {
            ownerId: friend.id,
            isDefault: true,
          },
          select: { permalink: true },
        });
        wishlistPermalink = defaultWishlist?.permalink || null;
      }

      upcomingOccasions.push({
        friend,
        occasionType: occasion.type,
        occasionTitle: occasion.title,
        daysUntil,
        date: occasion.nextOccurrence.toISOString(),
        wishlistPermalink,
      });
    }
  }

  // Sort upcoming occasions by days until occurrence
  upcomingOccasions.sort((a, b) => a.daysUntil - b.daysUntil);

  // Get claimed gifts that haven't been sent
  const claimedGifts = await prisma.claim.findMany({
    where: {
      userId: currentUserId,
    },
    select: {
      id: true,
      createdAt: true,
      sent: true,
      item: {
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          imageUrl: true,
          wishlist: {
            select: {
              id: true,
              title: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    wishlists: wishlists.map((wishlist) => ({
      id: wishlist.id,
      title: wishlist.title,
      description: wishlist.description || undefined,
      permalink: wishlist.permalink,
      privacy: wishlist.privacy as "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE",
      isDefault: wishlist.isDefault,
      createdAt: wishlist.createdAt.toISOString(),
      _count: wishlist._count,
      items: wishlist.items.map((item) => ({
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl || undefined,
        imageBlurhash: item.blurhash || undefined,
      })),
    })),
    upcomingOccasions: upcomingOccasions.map((occasion) => ({
      ...occasion,
      wishlistPermalink: occasion.wishlistPermalink,
      friend: {
        ...occasion.friend,
        image: occasion.friend.image || undefined,
        profile: occasion.friend.profile
          ? {
              birthday: occasion.friend.profile.birthday?.toISOString(),
            }
          : undefined,
      },
    })),
    claimedGifts: claimedGifts.map((gift) => ({
      ...gift,
      createdAt: gift.createdAt.toISOString(),
      item: {
        ...gift.item,
        description: gift.item.description || undefined,
        price: gift.item.price ? Number(gift.item.price) : undefined,
        imageUrl: gift.item.imageUrl || undefined,
      },
    })),
  };
}

/**
 * Fetch user's wishlists
 */
export async function fetchUserWishlists(): Promise<WishlistData[]> {
  const session = await getServerSession();
  if (!session?.user) {
    throw new Error("User not authenticated");
  }

  const wishlists = await WishlistService.getInstance().getUserWishlists(session.user.id);

  return wishlists.map((wishlist) => ({
    id: wishlist.id,
    title: wishlist.title,
    description: wishlist.description || undefined,
    permalink: wishlist.permalink,
    privacy: wishlist.privacy as "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE",
    isDefault: wishlist.isDefault,
    createdAt: wishlist.createdAt.toISOString(),
    _count: wishlist._count,
  }));
}

/**
 * Fetch wishlist by permalink with proper access control
 */
export async function fetchWishlistByPermalink(permalink: string): Promise<{
  success: boolean;
  statusCode: number;
  data: SerializedWishlist | null;
}> {
  const session = await getServerSession();

  // Use the service layer which handles access control
  const wishlist = await WishlistService.getInstance().getWishlistByPermalink(
    permalink,
    session?.user?.id
  );

  if (!wishlist) {
    return {
      success: false,
      statusCode: 404,
      data: null,
    };
  }

  return {
    success: true,
    statusCode: 200,
    data: {
      ...wishlist,
      createdAt: wishlist.createdAt.toISOString(),
      updatedAt: wishlist.updatedAt.toISOString(),
      deletedAt: wishlist.deletedAt?.toISOString() || null,
      items:
        wishlist.items?.map((item) => ({
          ...item,
          price: item.price ? Number(item.price) : null,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
          deletedAt: item.deletedAt?.toISOString() || null,
          claims:
            item.claims?.map((claim) => ({
              ...claim,
              createdAt: claim.createdAt.toISOString(),
              sentAt: claim.sentAt?.toISOString() || null,
            })) || [],
        })) || [],
    },
  };
}

/**
 * Fetch user profile data
 */
export async function fetchUserProfile(userId: string) {
  const session = await getServerSession();
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
    return {
      success: false,
      statusCode: 404,
      data: null,
    };
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

  // Get visible wishlists based on relationship
  let whereClause: {
    ownerId: string;
    privacy?:
      | "PUBLIC"
      | "FRIENDS_ONLY"
      | "PRIVATE"
      | { in: ("PUBLIC" | "FRIENDS_ONLY" | "PRIVATE")[] };
  } = {
    ownerId: userId,
    privacy: "PUBLIC",
  };

  if (viewerId === userId) {
    // User viewing their own profile - show all wishlists
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
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  // Apply privacy redaction if not a friend or self
  const privacyService = PrivacyService.getInstance();
  const isFriendOrSelf = viewerId === userId || friendshipStatus === "friends";
  const redactedUser = privacyService.redactUserData(user, isFriendOrSelf);

  return {
    success: true,
    statusCode: 200,
    data: {
      user: {
        id: redactedUser?.id || "",
        name: redactedUser?.name || undefined,
        email: user.email,
        image: redactedUser?.image || undefined,
        profile: user.profile
          ? {
              birthday: user.profile.birthday?.toISOString(),
            }
          : undefined,
      },
      friendshipStatus,
      wishlists: wishlists.map((wishlist) => ({
        ...wishlist,
        description: wishlist.description || undefined,
        createdAt: wishlist.createdAt.toISOString(),
      })),
      isOwnProfile: viewerId === userId,
    },
  };
}

/**
 * Fetch friends data (friends list and friend requests)
 */
export async function fetchFriendsData(): Promise<FriendsData> {
  const session = await getServerSession();
  if (!session?.user) {
    throw new Error("User not authenticated");
  }

  const currentUserId = session.user.id;

  // Fetch friends
  const friendships = await prisma.friendship.findMany({
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
        ...friend,
        visibleWishlistCount,
      };
    })
  );

  // Fetch incoming friend requests
  const incomingRequests = await prisma.friendRequest.findMany({
    where: {
      receiverId: currentUserId,
      status: "PENDING",
    },
    select: {
      id: true,
      createdAt: true,
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch outgoing friend requests
  const outgoingRequests = await prisma.friendRequest.findMany({
    where: {
      requesterId: currentUserId,
      status: "PENDING",
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    friends: friendsWithCounts.map((friend) => ({
      ...friend,
      image: friend.image || undefined,
    })),
    friendRequests: [
      ...incomingRequests.map((request) => ({
        ...request,
        createdAt: request.createdAt.toISOString(),
        type: "incoming" as const,
        requester: {
          ...request.requester,
          image: request.requester.image || undefined,
        },
      })),
      ...outgoingRequests.map((request) => ({
        ...request,
        createdAt: request.createdAt.toISOString(),
        type: "outgoing" as const,
      })),
    ],
  };
}
