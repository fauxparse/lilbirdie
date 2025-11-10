import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const currentUserEmail = session.user.email;

    // Get incoming friend requests for the current user
    const incomingRequests = await prisma.friendRequest.findMany({
      where: {
        email: currentUserEmail,
        status: "PENDING",
      },
      select: {
        id: true,
        email: true,
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

    // Get outgoing friend requests from the current user
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

    return NextResponse.json([
      ...incomingRequests.map((request) => ({
        ...request,
        type: "incoming" as const,
      })),
      ...outgoingRequests.map((request) => ({
        ...request,
        type: "outgoing" as const,
      })),
    ]);
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
