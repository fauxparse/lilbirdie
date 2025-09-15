import { Prisma } from "@prisma/client";
import type { CreateWishlistItemData, UpdateWishlistItemData } from "../../types";
import { prisma } from "../db";

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
                email: true,
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
            email: true,
          },
        },
      },
    });

    if (!wishlist) {
      throw new Error("Wishlist not found");
    }

    // Privacy check
    if (wishlist.privacy === "PRIVATE" && wishlist.ownerId !== viewerId) {
      throw new Error("Wishlist not found");
    }

    if (wishlist.privacy === "FRIENDS_ONLY" && wishlist.ownerId !== viewerId) {
      // TODO: Check friendship when friends system is implemented
      // For now, allow access
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
                      email: true,
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
                email: true,
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
                email: true,
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

    if (item.wishlist.ownerId !== userId) {
      throw new Error("Access denied");
    }

    const updateData: {
      name?: string;
      description?: string | null;
      url?: string | null;
      imageUrl?: string | null;
      price?: Prisma.Decimal | null;
      currency?: string;
      priority?: number;
      tags?: string[];
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.price !== undefined)
      updateData.price = data.price ? new Prisma.Decimal(data.price) : null;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.tags !== undefined) updateData.tags = data.tags;

    return await prisma.wishlistItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        claims: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });
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
            email: true,
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
            email: true,
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
