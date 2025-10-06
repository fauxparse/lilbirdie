import { WishlistPrivacy } from "@prisma/client";
import { ClaimWithUser, WishlistWithItems } from "@/types";
import { prisma } from "../db";
import { PrivacyService } from "./PrivacyService";

export interface CreateWishlistData {
  title: string;
  description?: string;
  privacy: WishlistPrivacy;
  isDefault?: boolean;
}

export interface UpdateWishlistData {
  title?: string;
  description?: string;
  privacy?: WishlistPrivacy;
  isDefault?: boolean;
}

export class WishlistService {
  private static instance: WishlistService | undefined;

  private privacyService = PrivacyService.getInstance();

  private constructor() {}

  public static resetInstance() {
    WishlistService.instance = undefined;
  }

  public static getInstance(): WishlistService {
    if (!WishlistService.instance) {
      WishlistService.instance = new WishlistService();
    }
    return WishlistService.instance;
  }

  async getUserWishlists(userId: string) {
    return await prisma.wishlist.findMany({
      where: {
        ownerId: userId,
        // isDeleted: false, // TODO: Enable after migration
      },
      include: {
        items: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { items: { where: { isDeleted: false } } },
        },
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  async getWishlistByPermalink(permalink: string, viewerId?: string) {
    // First, get basic wishlist info to check ownership
    const basicWishlist = await prisma.wishlist.findUnique({
      where: { permalink },
      select: { id: true, ownerId: true, privacy: true },
    });

    if (!basicWishlist) {
      return null;
    }

    const isOwner = viewerId === basicWishlist.ownerId;
    const shouldIncludeClaims = viewerId && !isOwner;

    const wishlist = (await prisma.wishlist.findUnique({
      where: { permalink },
      include: {
        owner: {
          select: { id: true, name: true, image: true },
        },
        items: {
          where: { isDeleted: false },
          include: {
            claims: shouldIncludeClaims
              ? {
                  include: {
                    user: {
                      select: { id: true, name: true, image: true },
                    },
                  },
                }
              : false,
          },
          orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        },
      },
    })) as WishlistWithItems | null;

    if (!wishlist) {
      return null;
    }

    // Check privacy permissions using basic wishlist info
    if (basicWishlist.privacy === "PRIVATE" && basicWishlist.ownerId !== viewerId) {
      return null;
    }

    if (basicWishlist.privacy === "FRIENDS_ONLY" && basicWishlist.ownerId !== viewerId) {
      // Check if viewer is friends with owner
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: basicWishlist.ownerId, friendId: viewerId },
            { userId: viewerId, friendId: basicWishlist.ownerId },
          ],
        },
      });

      if (!friendship) {
        return null;
      }
    }

    // Apply privacy redaction to claims user data (only if claims were included)
    if (shouldIncludeClaims) {
      for (const item of wishlist.items) {
        if (item.claims && Array.isArray(item.claims) && item.claims.length > 0) {
          // Type guard to ensure we have claims with user data
          const claimsWithUser = item.claims.filter(
            (claim): claim is ClaimWithUser => claim && typeof claim === "object" && "user" in claim
          );

          if (claimsWithUser.length > 0) {
            const claimsWithUserData = claimsWithUser.map(
              (claim) =>
                ({
                  id: claim.id,
                  userId: claim.userId,
                  itemId: claim.itemId,
                  wishlistId: claim.wishlistId,
                  createdAt: claim.createdAt,
                  user: claim.user,
                  sent: false,
                  sentAt: null,
                }) satisfies ClaimWithUser
            );
            const redactedClaims = await this.privacyService.redactClaimsUserData(
              claimsWithUserData,
              viewerId || ""
            );
            item.claims = redactedClaims;
          }
        }
      }
    }

    // Redact owner data if not a friend (but not for public wishlists)
    if (viewerId && wishlist.ownerId !== viewerId && wishlist.privacy !== "PUBLIC") {
      const isOwnerFriend = await this.privacyService.areFriends(viewerId, wishlist.ownerId);
      wishlist.owner =
        wishlist.owner && this.privacyService.redactUserData(wishlist.owner, isOwnerFriend);
    }

    return wishlist;
  }

  async createWishlist(userId: string, data: CreateWishlistData) {
    // Generate unique permalink
    const basePermalink = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50);

    let permalink = basePermalink;
    let counter = 1;

    while (await prisma.wishlist.findUnique({ where: { permalink } })) {
      permalink = `${basePermalink}-${counter}`;
      counter++;
    }

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await prisma.wishlist.updateMany({
        where: { ownerId: userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return await prisma.wishlist.create({
      data: {
        ...data,
        permalink,
        ownerId: userId,
      },
      include: {
        items: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { items: { where: { isDeleted: false } } },
        },
      },
    });
  }

  async updateWishlist(wishlistId: string, userId: string, data: Partial<UpdateWishlistData>) {
    // Verify ownership
    const wishlist = await prisma.wishlist.findFirst({
      where: { id: wishlistId, ownerId: userId },
    });

    if (!wishlist) {
      return null;
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.wishlist.updateMany({
        where: { ownerId: userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return await prisma.wishlist.update({
      where: { id: wishlistId },
      data,
      include: {
        items: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { items: { where: { isDeleted: false } } },
        },
      },
    });
  }

  async deleteWishlist(wishlistId: string, userId: string) {
    // Verify ownership
    const wishlist = await prisma.wishlist.findFirst({
      where: {
        id: wishlistId,
        ownerId: userId,
        isDeleted: false,
      },
    });

    if (!wishlist) {
      return null;
    }

    // Can't delete default wishlist if it's the only non-deleted one
    if (wishlist.isDefault) {
      const otherWishlists = await prisma.wishlist.findMany({
        where: {
          ownerId: userId,
          id: { not: wishlistId },
          isDeleted: false,
        },
      });

      if (otherWishlists.length === 0) {
        throw new Error("Cannot delete the only wishlist");
      }

      // Set another wishlist as default
      await prisma.wishlist.update({
        where: { id: otherWishlists[0].id },
        data: { isDefault: true },
      });
    }

    // Soft delete the wishlist
    return await prisma.wishlist.update({
      where: { id: wishlistId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async restoreWishlist(wishlistId: string, userId: string) {
    // Verify ownership
    const wishlist = await prisma.wishlist.findFirst({
      where: {
        id: wishlistId,
        ownerId: userId,
        isDeleted: true,
      },
    });

    if (!wishlist) {
      throw new Error("Deleted wishlist not found");
    }

    // Restore the wishlist
    return await prisma.wishlist.update({
      where: { id: wishlistId },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });
  }

  async getRecentlyDeletedWishlists(userId: string, limit: number = 10) {
    // Get recently deleted wishlists for the user (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return await prisma.wishlist.findMany({
      where: {
        ownerId: userId,
        isDeleted: true,
        deletedAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: {
        deletedAt: "desc",
      },
      take: limit,
    });
  }

  async permanentlyDeleteWishlist(wishlistId: string, userId: string) {
    // Verify ownership and that it's already soft deleted
    const wishlist = await prisma.wishlist.findFirst({
      where: {
        id: wishlistId,
        ownerId: userId,
        isDeleted: true,
      },
    });

    if (!wishlist) {
      throw new Error("Deleted wishlist not found");
    }

    // Permanently delete the wishlist and all its items
    return await prisma.wishlist.delete({
      where: { id: wishlistId },
    });
  }
}
