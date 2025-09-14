import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
) {
  try {
    const { claimId } = await params;

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;

    // Verify the claim belongs to the current user
    const claim = await prisma.claim.findUnique({
      where: {
        id: claimId,
      },
      select: {
        userId: true,
        sent: true,
      },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    if (claim.userId !== currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (claim.sent) {
      return NextResponse.json({ error: "Gift already marked as sent" }, { status: 400 });
    }

    // Mark the claim as sent
    const updatedClaim = await prisma.claim.update({
      where: {
        id: claimId,
      },
      data: {
        sent: true,
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Gift marked as sent",
      claim: updatedClaim,
    });
  } catch (error) {
    console.error("Error marking gift as sent:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
