import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PermissionService } from "@/lib/services/PermissionService";

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const wishlistId = searchParams.get("wishlistId");
    const organizationId = searchParams.get("organizationId");

    const permissionService = PermissionService.getInstance();

    // Create permission context
    const context = {
      userId: session.user.id,
      ...(wishlistId && { wishlistId }),
      ...(organizationId && { organizationId }),
    };

    // Get user permissions
    const permissions = await permissionService.getUserPermissions(context);

    // Get user role
    let role: string | undefined;

    if (wishlistId) {
      // If wishlistId is a permalink, resolve it to the actual ID
      let actualWishlistId = wishlistId;

      // Check if this looks like a permalink (not a cuid)
      if (!wishlistId.startsWith("c")) {
        const wishlist = await prisma.wishlist.findUnique({
          where: { permalink: wishlistId },
          select: { id: true },
        });

        if (!wishlist) {
          return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
        }

        actualWishlistId = wishlist.id;
      }

      role = await permissionService.getUserWishlistRole(session.user.id, actualWishlistId);
    } else if (organizationId) {
      const member = await prisma.member.findFirst({
        where: { userId: session.user.id, organizationId },
        select: { role: true },
      });
      role = member?.role;
    }

    return NextResponse.json({
      permissions,
      role,
      userId: session.user.id,
      context: {
        wishlistId: wishlistId,
        organizationId,
      },
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
}
