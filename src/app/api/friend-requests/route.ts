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

    // TEMPORARY: Add fake ninja turtle friend requests (incoming)
    const fakeTurtles = [
      { id: "leo-1", name: "Leonardo", email: "leo@tmnt.com" },
      { id: "raph-1", name: "Raphael", email: "raph@tmnt.com" },
      { id: "don-1", name: "Donatello", email: "don@tmnt.com" },
      { id: "mike-1", name: "Michelangelo", email: "mike@tmnt.com" },
    ];

    const fakeIncomingRequests = fakeTurtles.map((turtle, index) => ({
      id: `fake-incoming-${turtle.id}`,
      email: currentUserEmail,
      createdAt: new Date(Date.now() - index * 3600000), // Stagger by 1 hour each
      type: "incoming" as const,
      requester: {
        id: turtle.id,
        name: turtle.name,
        email: turtle.email,
        image: null,
      },
    }));

    // TEMPORARY: Add fake outgoing request to Master Splinter
    const fakeOutgoingRequests = [
      {
        id: "fake-outgoing-splinter",
        email: "splinter@tmnt.com",
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        type: "outgoing" as const,
      },
    ];

    return NextResponse.json([
      ...fakeIncomingRequests,
      ...incomingRequests.map((request) => ({
        ...request,
        type: "incoming" as const,
      })),
      ...fakeOutgoingRequests,
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
