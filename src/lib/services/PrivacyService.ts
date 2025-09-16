import { ClaimWithUser } from "@/types";
import { prisma } from "../db";

export interface UserData {
  id: string;
  name: string | null;
  image: string | null;
}

export type RedactedUserData = UserData | null;

export class PrivacyService {
  private static instance: PrivacyService;

  private constructor() {}

  public static getInstance(): PrivacyService {
    if (!PrivacyService.instance) {
      PrivacyService.instance = new PrivacyService();
    }
    return PrivacyService.instance;
  }

  /**
   * Check if two users are friends
   */
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    if (userId1 === userId2) {
      return true; // Users are always "friends" with themselves
    }

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: userId1, friendId: userId2 },
          { userId: userId2, friendId: userId1 },
        ],
      },
    });

    return !!friendship;
  }

  /**
   * Check if multiple users are friends with the viewer
   */
  async checkFriendships(viewerId: string, userIds: string[]): Promise<Map<string, boolean>> {
    const friendshipMap = new Map<string, boolean>();

    if (userIds.length === 0) {
      return friendshipMap;
    }

    // Add self as always being a friend
    if (userIds.includes(viewerId)) {
      friendshipMap.set(viewerId, true);
    }

    const otherUserIds = userIds.filter((id) => id !== viewerId);

    if (otherUserIds.length === 0) {
      return friendshipMap;
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: viewerId, friendId: { in: otherUserIds } },
          { userId: { in: otherUserIds }, friendId: viewerId },
        ],
      },
      select: {
        userId: true,
        friendId: true,
      },
    });

    // Initialize all as not friends
    for (const userId of otherUserIds) {
      friendshipMap.set(userId, false);
    }

    // Mark actual friends
    for (const friendship of friendships) {
      if (friendship.userId === viewerId) {
        friendshipMap.set(friendship.friendId, true);
      } else {
        friendshipMap.set(friendship.userId, true);
      }
    }

    return friendshipMap;
  }

  /**
   * Redact user data for non-friends
   */
  redactUserData(userData: UserData, isFriend: boolean): RedactedUserData {
    if (isFriend) {
      return userData;
    }

    return null; // Hide entire user record for non-friends
  }

  /**
   * Redact multiple users' data based on friendship status
   */
  redactMultipleUsers(
    usersData: UserData[],
    friendshipMap: Map<string, boolean>
  ): RedactedUserData[] {
    return usersData.map((userData) => {
      const isFriend = friendshipMap.get(userData.id) || false;
      return this.redactUserData(userData, isFriend);
    });
  }

  /**
   * Process claims data to redact non-friend user information
   */
  async redactClaimsUserData(
    claims: Array<ClaimWithUser>,
    viewerId: string
  ): Promise<Array<ClaimWithUser>> {
    if (claims.length === 0) {
      return [];
    }

    const userIds = claims.map((claim) => claim.userId);
    const friendshipMap = await this.checkFriendships(viewerId, userIds);

    return claims.map((claim) => ({
      ...claim,
      user: claim.user && this.redactUserData(claim.user, friendshipMap.get(claim.userId) || false),
    }));
  }
}
