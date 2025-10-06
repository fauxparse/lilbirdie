import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";
import { Permission } from "@/lib/services/PermissionService";

interface UsePermissionsOptions {
  wishlistId?: string;
  organizationId?: string;
  enabled?: boolean;
}

interface PermissionsResponse {
  permissions: Permission[];
  role?: string;
}

/**
 * Hook to check user permissions on the client side
 */
export function usePermissions(options: UsePermissionsOptions = {}) {
  const { user } = useAuth();

  const {
    data: permissionsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["permissions", user?.id, options.wishlistId, options.organizationId],
    queryFn: async (): Promise<PermissionsResponse> => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const params = new URLSearchParams();
      if (options.wishlistId) {
        params.append("wishlistId", options.wishlistId);
      }
      if (options.organizationId) {
        params.append("organizationId", options.organizationId);
      }

      const response = await fetch(`/api/permissions?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch permissions");
      }

      return response.json();
    },
    enabled: !!user?.id && (options.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const permissions = permissionsData?.permissions ?? [];
  const role = permissionsData?.role;

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  /**
   * Check if user has any of the provided permissions
   */
  const hasAnyPermission = (permissionList: Permission[]): boolean => {
    return permissionList.some((permission) => permissions.includes(permission));
  };

  /**
   * Check if user has all of the provided permissions
   */
  const hasAllPermissions = (permissionList: Permission[]): boolean => {
    return permissionList.every((permission) => permissions.includes(permission));
  };

  /**
   * Check if user can read wishlists
   */
  const canRead = hasPermission("wishlists:read");

  /**
   * Check if user can write/edit wishlists
   */
  const canWrite = hasPermission("wishlists:write");

  /**
   * Check if user can delete wishlists
   */
  const canDelete = hasPermission("wishlists:delete");

  /**
   * Check if user can share wishlists
   */
  const canShare = hasPermission("wishlists:share");

  /**
   * Check if user can read items
   */
  const canReadItems = hasPermission("items:read");

  /**
   * Check if user can write/edit items
   */
  const canWriteItems = hasPermission("items:write");

  /**
   * Check if user can delete items
   */
  const canDeleteItems = hasPermission("items:delete");

  /**
   * Check if user can move items
   */
  const canMoveItems = hasPermission("items:move");

  /**
   * Check if user can claim items
   */
  const canClaimItems = hasPermission("items:claim");

  /**
   * Check if user can invite friends
   */
  const canInviteFriends = hasPermission("friends:invite");

  /**
   * Check if user can manage friends
   */
  const canManageFriends = hasPermission("friends:manage");

  /**
   * Check if user can invite members
   */
  const canInviteMembers = hasPermission("members:invite");

  /**
   * Check if user can remove members
   */
  const canRemoveMembers = hasPermission("members:remove");

  /**
   * Check if user is the owner
   */
  const isOwner = role === "owner";

  /**
   * Check if user is a collaborator
   */
  const isCollaborator = role === "collaborator";

  /**
   * Check if user is a friend
   */
  const isFriend = role === "friend";

  /**
   * Check if user is a viewer
   */
  const isViewer = role === "viewer";

  return {
    // Raw data
    permissions,
    role,
    isLoading,
    error,

    // Permission checkers
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Convenience getters for common permissions
    canRead,
    canWrite,
    canDelete,
    canShare,
    canReadItems,
    canWriteItems,
    canDeleteItems,
    canMoveItems,
    canClaimItems,
    canInviteFriends,
    canManageFriends,
    canInviteMembers,
    canRemoveMembers,

    // Role checkers
    isOwner,
    isCollaborator,
    isFriend,
    isViewer,
  };
}

/**
 * Hook specifically for wishlist permissions
 */
export function useWishlistPermissions(wishlistId?: string) {
  return usePermissions({ wishlistId });
}

/**
 * Hook specifically for organization permissions
 */
export function useOrganizationPermissions(organizationId?: string) {
  return usePermissions({ organizationId });
}
