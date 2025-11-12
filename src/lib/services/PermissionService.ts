import { prisma } from "@/lib/db";

export type Permission =
  | "wishlists:read"
  | "wishlists:write"
  | "wishlists:delete"
  | "wishlists:share"
  | "items:read"
  | "items:write"
  | "items:delete"
  | "items:move"
  | "items:claim"
  | "friends:invite"
  | "friends:manage"
  | "members:invite"
  | "members:remove";

export type WishlistRole = "owner" | "collaborator" | "friend" | "viewer";

export interface PermissionContext {
  userId: string;
  wishlistId?: string;
  organizationId?: string;
}

export class PermissionService {
  private static instance: PermissionService | undefined;

  private constructor() {}

  public static resetInstance() {
    PermissionService.instance = undefined;
  }

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  /**
   * Check if a user has a specific permission in a context
   */
  async hasPermission(context: PermissionContext, permission: Permission): Promise<boolean> {
    try {
      if (context.wishlistId) {
        return await this.hasWishlistPermission(context.userId, context.wishlistId, permission);
      }

      if (context.organizationId) {
        return await this.hasOrganizationPermission(
          context.userId,
          context.organizationId,
          permission
        );
      }

      // Global permissions (like friends:invite)
      return await this.hasGlobalPermission(context.userId, permission);
    } catch (error) {
      console.error("Permission check failed:", error);
      return false;
    }
  }

  /**
   * Get user's role for a specific wishlist
   */
  async getUserWishlistRole(userId: string, wishlistId: string): Promise<WishlistRole | null> {
    // Check if user is the owner
    const wishlist = await prisma.wishlist.findFirst({
      where: { id: wishlistId, ownerId: userId },
    });

    if (wishlist) {
      return "owner";
    }

    // Check if user is an editor/collaborator
    const editor = await prisma.wishlistEditor.findFirst({
      where: { wishlistId, userId },
    });

    if (editor) {
      return editor.canDelete ? "collaborator" : "collaborator";
    }

    // Check if user is a friend of the owner
    const wishlistWithOwner = await prisma.wishlist.findUnique({
      where: { id: wishlistId },
      select: { ownerId: true, privacy: true },
    });

    if (!wishlistWithOwner) {
      return null;
    }

    // For public wishlists, anyone can view
    if (wishlistWithOwner.privacy === "PUBLIC") {
      return "viewer";
    }

    // Check friendship for friends-only or private wishlists
    if (wishlistWithOwner.privacy === "FRIENDS_ONLY") {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: wishlistWithOwner.ownerId, friendId: userId },
            { userId, friendId: wishlistWithOwner.ownerId },
          ],
        },
      });

      if (friendship) {
        return "friend";
      }
    }

    return null; // No access
  }

  /**
   * Check permissions for wishlist-related actions
   */
  private async hasWishlistPermission(
    userId: string,
    wishlistId: string,
    permission: Permission
  ): Promise<boolean> {
    const role = await this.getUserWishlistRole(userId, wishlistId);

    if (!role) {
      return false;
    }

    return this.roleHasPermission(role, permission);
  }

  /**
   * Check permissions for organization-related actions
   */
  private async hasOrganizationPermission(
    userId: string,
    organizationId: string,
    permission: Permission
  ): Promise<boolean> {
    const member = await prisma.member.findFirst({
      where: { userId, organizationId },
    });

    if (!member) {
      return false;
    }

    return this.roleHasPermission(member.role as WishlistRole, permission);
  }

  /**
   * Check global permissions (not tied to specific resource)
   */
  private async hasGlobalPermission(_userId: string, permission: Permission): Promise<boolean> {
    // Global permissions like friends:invite are always allowed for authenticated users
    const globalPermissions: Permission[] = ["friends:invite", "friends:manage"];

    if (globalPermissions.includes(permission)) {
      return true;
    }

    return false;
  }

  /**
   * Check if a role has a specific permission
   */
  private roleHasPermission(role: string, permission: Permission): boolean {
    const rolePermissions: Record<string, Permission[]> = {
      owner: [
        "wishlists:read",
        "wishlists:write",
        "wishlists:delete",
        "wishlists:share",
        "items:read",
        "items:write",
        "items:delete",
        "items:move",
        "items:claim",
        "friends:invite",
        "friends:manage",
        "members:invite",
        "members:remove",
      ],
      collaborator: [
        "wishlists:read",
        "wishlists:write",
        "items:read",
        "items:write",
        "items:move",
        "items:claim",
      ],
      friend: ["wishlists:read", "items:read", "items:claim"],
      viewer: ["wishlists:read", "items:read", "items:claim"],
    };

    return rolePermissions[role]?.includes(permission) ?? false;
  }

  /**
   * Require permission or throw error (for middleware use)
   */
  async requirePermission(context: PermissionContext, permission: Permission): Promise<void> {
    const hasPermission = await this.hasPermission(context, permission);

    if (!hasPermission) {
      throw new Error(`Access denied: missing permission '${permission}'`);
    }
  }

  /**
   * Get all permissions for a user in a context
   */
  async getUserPermissions(context: PermissionContext): Promise<Permission[]> {
    const permissions: Permission[] = [];

    if (context.wishlistId) {
      const role = await this.getUserWishlistRole(context.userId, context.wishlistId);
      if (role) {
        permissions.push(...this.getRolePermissions(role));
      }
    }

    // Add global permissions
    permissions.push("friends:invite", "friends:manage");

    return [...new Set(permissions)]; // Remove duplicates
  }

  /**
   * Get all permissions for a role
   */
  private getRolePermissions(role: string): Permission[] {
    const rolePermissions: Record<string, Permission[]> = {
      owner: [
        "wishlists:read",
        "wishlists:write",
        "wishlists:delete",
        "wishlists:share",
        "items:read",
        "items:write",
        "items:delete",
        "items:move",
        "items:claim",
        "members:invite",
        "members:remove",
      ],
      collaborator: [
        "wishlists:read",
        "wishlists:write",
        "items:read",
        "items:write",
        "items:move",
        "items:claim",
      ],
      friend: ["wishlists:read", "items:read", "items:claim"],
      viewer: ["wishlists:read", "items:read", "items:claim"],
    };

    return rolePermissions[role] ?? [];
  }
}
