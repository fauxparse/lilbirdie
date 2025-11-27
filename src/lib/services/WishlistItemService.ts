import { Prisma } from "@prisma/client";
import type { CreateWishlistItemData, UpdateWishlistItemData } from "../../types";
import { prisma } from "../db";
import { PrivacyService } from "./PrivacyService";

export class WishlistItemService {
  private static instance: WishlistItemService;

  private constructor() {}

  public static getInstance(): WishlistItemService {
    if (!WishlistItemService.instance) {
      WishlistItemService.instance = new WishlistItemService();
    }
    return WishlistItemService.instance;
  }

  async createItem(wishlistId: string, userId: string, data: CreateWishlistItemData) {
    // First verify the user owns the wishlist
    const wishlist = await prisma.wishlist.findFirst({
      where: {
        id: wishlistId,
        ownerId: userId,
      },
    });

    if (!wishlist) {
      throw new Error("Wishlist not found or access denied");
    }

    return await prisma.wishlistItem.create({
      data: {
        name: data.name,
        description: data.description,
        url: data.url,
        imageUrl: data.imageUrl,
        blurhash: data.blurhash,
        price: data.price ? new Prisma.Decimal(data.price) : null,
        currency: data.currency || "USD",
        priority: data.priority || 0,
        tags: data.tags || [],
        wishlistId,
      },
      include: {
        claims: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });
  }

  async getItemsByWishlistId(wishlistId: string, viewerId?: string) {
    // Check if wishlist exists and is accessible
    const wishlist = await prisma.wishlist.findFirst({
      where: {
        id: wishlistId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!wishlist) {
      throw new Error("Wishlist not found");
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

    // Privacy check (skip for admins)
    if (!isViewerAdmin) {
      if (wishlist.privacy === "PRIVATE" && wishlist.ownerId !== viewerId) {
        throw new Error("Wishlist not found");
      }

      if (wishlist.privacy === "FRIENDS_ONLY" && wishlist.ownerId !== viewerId) {
        // Check friendship
        const friendship = await prisma.friendship.findFirst({
          where: {
            OR: [
              { userId: wishlist.ownerId, friendId: viewerId },
              { userId: viewerId, friendId: wishlist.ownerId },
            ],
          },
        });

        if (!friendship) {
          throw new Error("Wishlist not found");
        }
      }
    }

    return await prisma.wishlistItem.findMany({
      where: {
        wishlistId,
        isDeleted: false,
      },
      include: {
        claims:
          viewerId === wishlist.ownerId
            ? false
            : {
                where: {
                  userId: viewerId,
                },
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });
  }

  async getItemById(itemId: string, viewerId?: string) {
    const item = await prisma.wishlistItem.findFirst({
      where: {
        id: itemId,
        isDeleted: false,
      },
      include: {
        wishlist: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        claims: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      throw new Error("Item not found");
    }

    // Privacy check via wishlist
    if (item.wishlist.privacy === "PRIVATE" && item.wishlist.ownerId !== viewerId) {
      throw new Error("Item not found");
    }

    if (item.wishlist.privacy === "FRIENDS_ONLY" && item.wishlist.ownerId !== viewerId) {
      // TODO: Check friendship when friends system is implemented
      // For now, allow access
    }

    // Apply privacy redaction to claims user data
    const privacyService = PrivacyService.getInstance();

    if (item.claims && item.claims.length > 0) {
      const claimsWithUserData = item.claims.map((claim) => ({
        ...claim,
        user: { ...claim.user },
      }));
      const redactedClaims = await privacyService.redactClaimsUserData(
        claimsWithUserData,
        viewerId || ""
      );
      item.claims = redactedClaims as typeof item.claims;
    }

    // Redact wishlist owner data if not a friend
    if (viewerId && item.wishlist.ownerId !== viewerId) {
      const isOwnerFriend = await privacyService.areFriends(viewerId, item.wishlist.ownerId);
      item.wishlist.owner = privacyService.redactUserData(
        item.wishlist.owner,
        isOwnerFriend
      ) as typeof item.wishlist.owner;
    }

    return item;
  }

  async updateItem(itemId: string, userId: string, data: UpdateWishlistItemData) {
    // First verify the user owns the wishlist that contains this item
    const item = await prisma.wishlistItem.findFirst({
      where: {
        id: itemId,
        isDeleted: false,
      },
      include: {
        wishlist: true,
      },
    });

    if (!item) {
      throw new Error("Item not found");
    }

    // Check if user is admin - admins can edit items on any wishlist
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { admin: true },
    });
    const isUserAdmin = user?.admin ?? false;

    if (!isUserAdmin && item.wishlist.ownerId !== userId) {
      throw new Error("Access denied");
    }

    const updateData: {
      name?: string;
      description?: string | null;
      url?: string | null;
      imageUrl?: string | null;
      blurhash?: string | null;
      price?: Prisma.Decimal | null;
      currency?: string;
      priority?: number;
      tags?: string[];
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.blurhash !== undefined) updateData.blurhash = data.blurhash;
    if (data.price !== undefined)
      updateData.price = data.price ? new Prisma.Decimal(data.price) : null;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.tags !== undefined) updateData.tags = data.tags;

    const updatedItem = await prisma.wishlistItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        claims: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Apply privacy redaction to claims user data
    const privacyService = PrivacyService.getInstance();

    if (updatedItem.claims && updatedItem.claims.length > 0) {
      const claimsWithUserData = updatedItem.claims.map((claim) => ({
        id: claim.id,
        userId: claim.userId,
        itemId: claim.itemId,
        wishlistId: claim.wishlistId,
        sent: claim.sent,
        sentAt: claim.sentAt,
        createdAt: claim.createdAt,
        user: claim.user,
      }));
      const redactedClaims = await privacyService.redactClaimsUserData(claimsWithUserData, userId);
      updatedItem.claims = redactedClaims as typeof updatedItem.claims;
    }

    return updatedItem;
  }

  async deleteItem(itemId: string, userId: string) {
    // First verify the user owns the wishlist that contains this item
    const item = await prisma.wishlistItem.findFirst({
      where: {
        id: itemId,
        isDeleted: false,
      },
      include: {
        wishlist: true,
      },
    });

    if (!item) {
      throw new Error("Item not found");
    }

    if (item.wishlist.ownerId !== userId) {
      throw new Error("Access denied");
    }

    // Soft delete
    return await prisma.wishlistItem.update({
      where: { id: itemId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async restoreItem(itemId: string, userId: string) {
    // First verify the user owns the wishlist that contains this item
    const item = await prisma.wishlistItem.findFirst({
      where: {
        id: itemId,
        isDeleted: true,
      },
      include: {
        wishlist: true,
      },
    });

    if (!item) {
      throw new Error("Deleted item not found");
    }

    if (item.wishlist.ownerId !== userId) {
      throw new Error("Access denied");
    }

    // Restore the item
    return await prisma.wishlistItem.update({
      where: { id: itemId },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });
  }

  async getRecentlyDeletedItems(userId: string, limit: number = 10) {
    // Get recently deleted items for the user (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return await prisma.wishlistItem.findMany({
      where: {
        isDeleted: true,
        deletedAt: {
          gte: sevenDaysAgo,
        },
        wishlist: {
          ownerId: userId,
        },
      },
      include: {
        wishlist: {
          select: {
            id: true,
            title: true,
            permalink: true,
          },
        },
      },
      orderBy: {
        deletedAt: "desc",
      },
      take: limit,
    });
  }

  async permanentlyDeleteItem(itemId: string, userId: string) {
    // First verify the user owns the wishlist that contains this item
    const item = await prisma.wishlistItem.findFirst({
      where: {
        id: itemId,
        isDeleted: true,
      },
      include: {
        wishlist: true,
      },
    });

    if (!item) {
      throw new Error("Deleted item not found");
    }

    if (item.wishlist.ownerId !== userId) {
      throw new Error("Access denied");
    }

    // Permanently delete the item
    return await prisma.wishlistItem.delete({
      where: { id: itemId },
    });
  }

  async moveItems(itemIds: string[], targetWishlistId: string, userId: string) {
    // Verify all items exist and are owned by the user
    const items = await prisma.wishlistItem.findMany({
      where: {
        id: { in: itemIds },
        isDeleted: false,
      },
      include: {
        wishlist: true,
      },
    });

    if (items.length !== itemIds.length) {
      throw new Error("One or more items not found");
    }

    // Verify user owns all source wishlists
    for (const item of items) {
      if (item.wishlist.ownerId !== userId) {
        throw new Error("Access denied to one or more items");
      }
    }

    // Verify target wishlist exists and is owned by the user
    const targetWishlist = await prisma.wishlist.findFirst({
      where: {
        id: targetWishlistId,
        ownerId: userId,
        isDeleted: false,
      },
    });

    if (!targetWishlist) {
      throw new Error("Target wishlist not found or access denied");
    }

    // Move items to target wishlist
    await prisma.wishlistItem.updateMany({
      where: {
        id: { in: itemIds },
      },
      data: {
        wishlistId: targetWishlistId,
      },
    });

    // Return the updated items with full details
    return await prisma.wishlistItem.findMany({
      where: {
        id: { in: itemIds },
      },
      include: {
        claims: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        wishlist: {
          select: {
            id: true,
            title: true,
            permalink: true,
          },
        },
      },
    });
  }

  async claimItem(itemId: string, userId: string) {
    // Get item and verify it's accessible and not owned by the user
    const item = await this.getItemById(itemId, userId);

    if (item.wishlist.ownerId === userId) {
      throw new Error("Cannot claim your own item");
    }

    // Check if already claimed by this user
    const existingClaim = await prisma.claim.findFirst({
      where: {
        itemId,
        userId,
      },
    });

    if (existingClaim) {
      throw new Error("Item already claimed by you");
    }

    // Get the wishlist ID for the claim
    const wishlistId = item.wishlist.id;

    return await prisma.claim.create({
      data: {
        itemId,
        userId,
        wishlistId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        item: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async unclaimItem(itemId: string, userId: string) {
    const claim = await prisma.claim.findFirst({
      where: {
        itemId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!claim) {
      throw new Error("Claim not found");
    }

    await prisma.claim.delete({
      where: {
        id: claim.id,
      },
    });

    return claim;
  }
}
