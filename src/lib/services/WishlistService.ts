import { WishlistPrivacy } from "@prisma/client";
import { prisma } from "../db";

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
  private static instance: WishlistService;

  private constructor() {}

  public static getInstance(): WishlistService {
    if (!WishlistService.instance) {
      WishlistService.instance = new WishlistService();
    }
    return WishlistService.instance;
  }

  async getUserWishlists(userId: string) {
    return await prisma.wishlist.findMany({
      where: { ownerId: userId },
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
    const wishlist = await prisma.wishlist.findUnique({
      where: { permalink },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        items: {
          where: { isDeleted: false },
          include: {
            claims: viewerId
              ? {
                  where: { userId: { not: viewerId } }, // Hide viewer's own claims
                  select: { userId: true, createdAt: true },
                }
              : false,
          },
          orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!wishlist) {
      return null;
    }

    // Check privacy permissions
    if (wishlist.privacy === "PRIVATE" && wishlist.ownerId !== viewerId) {
      return null;
    }

    if (wishlist.privacy === "FRIENDS_ONLY" && wishlist.ownerId !== viewerId) {
      // Check if viewer is friends with owner
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: wishlist.ownerId, friendId: viewerId },
            { userId: viewerId, friendId: wishlist.ownerId },
          ],
        },
      });

      if (!friendship) {
        return null;
      }
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

  async updateWishlist(wishlistId: string, userId: string, data: UpdateWishlistData) {
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
      where: { id: wishlistId, ownerId: userId },
    });

    if (!wishlist) {
      return null;
    }

    // Can't delete default wishlist if it's the only one
    if (wishlist.isDefault) {
      const otherWishlists = await prisma.wishlist.findMany({
        where: { ownerId: userId, id: { not: wishlistId } },
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

    return await prisma.wishlist.delete({
      where: { id: wishlistId },
    });
  }
}
