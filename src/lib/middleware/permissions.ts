import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Permission, PermissionContext, PermissionService } from "@/lib/services/PermissionService";

// Define a Session type for Better Auth
interface Session {
  user: {
    id: string;
    name?: string;
    email?: string;
  };
}

/**
 * Middleware to check permissions for API routes
 */
export async function withPermissions(
  request: NextRequest,
  permission: Permission,
  getContext: (request: NextRequest, session: Session) => Promise<PermissionContext>
) {
  try {
    // Get user session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get permission context
    const context = await getContext(request, session);

    // Check permissions
    const permissionService = PermissionService.getInstance();
    const hasPermission = await permissionService.hasPermission(context, permission);

    if (!hasPermission) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    return null; // Permission granted
  } catch (error) {
    console.error("Permission middleware error:", error);
    return NextResponse.json({ error: "Permission check failed" }, { status: 500 });
  }
}

/**
 * Helper to create permission context for wishlist operations
 */
export function createWishlistContext(userId: string, wishlistId: string): PermissionContext {
  return {
    userId,
    wishlistId,
  };
}

/**
 * Helper to create permission context for global operations
 */
export function createGlobalContext(userId: string): PermissionContext {
  return {
    userId,
  };
}

/**
 * Helper to extract wishlist ID from URL parameters
 */
export function getWishlistIdFromParams(params: Record<string, string | string[]>): string | null {
  const { permalink, wishlistId } = params;

  if (typeof wishlistId === "string") {
    return wishlistId;
  }

  if (typeof permalink === "string") {
    // For routes like /api/w/[permalink]/items, we need to resolve the permalink
    // This will need to be handled in the specific route handler
    return permalink;
  }

  return null;
}

/**
 * Higher-order function to create permission-protected route handlers
 */
export function protectRoute<T extends unknown[]>(
  permission: Permission,
  getContext: (request: NextRequest, session: Session, ...args: T) => Promise<PermissionContext>,
  handler: (request: NextRequest, session: Session, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Get user session
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Get permission context
      const context = await getContext(request, session, ...args);

      // Check permissions
      const permissionService = PermissionService.getInstance();
      const hasPermission = await permissionService.hasPermission(context, permission);

      if (!hasPermission) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }

      // Call the actual handler
      return await handler(request, session, ...args);
    } catch (error) {
      console.error("Protected route error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
