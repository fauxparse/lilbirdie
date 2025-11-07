import type { OccasionType } from "@prisma/client";
import { WishlistPrivacy } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { OccasionData } from "@/lib/services/WishlistService";
import { WishlistService } from "@/lib/services/WishlistService";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wishlists = await WishlistService.getInstance().getUserWishlists(session.user.id);

    return NextResponse.json(wishlists);
  } catch (error) {
    console.error("Error fetching wishlists:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      title?: string;
      description?: string;
      privacy?: string;
      isDefault?: boolean;
      occasions?: Array<{
        id?: string;
        type?: string;
        date?: string;
        title?: string;
        isRecurring?: boolean;
        startYear?: number;
      }>;
    };
    const { title, description, privacy, isDefault, occasions } = body;

    if (!title || title.trim() === "") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!privacy || !(Object.values(WishlistPrivacy) as string[]).includes(privacy)) {
      return NextResponse.json({ error: "Valid privacy setting is required" }, { status: 400 });
    }

    // Validate occasions data if provided
    let occasionsData: OccasionData[] | undefined;
    if (occasions && occasions.length > 0) {
      occasionsData = [];
      for (const occasion of occasions) {
        if (!occasion.type) continue;

        // Validate date requirement for non-fixed holidays
        if (
          !occasion.date &&
          occasion.type !== "CHRISTMAS" &&
          occasion.type !== "VALENTINES_DAY"
        ) {
          return NextResponse.json({ error: "Occasion date is required" }, { status: 400 });
        }

        occasionsData.push({
          id: occasion.id,
          type: occasion.type as OccasionType,
          date: occasion.date,
          title: occasion.title,
          isRecurring: occasion.isRecurring,
          startYear: occasion.startYear,
        });
      }
    }

    const wishlist = await WishlistService.getInstance().createWishlist(session.user.id, {
      title: title.trim(),
      description: description?.trim(),
      privacy: privacy as WishlistPrivacy,
      isDefault: !!isDefault,
      occasions: occasionsData,
    });

    return NextResponse.json(wishlist, { status: 201 });
  } catch (error) {
    console.error("Error creating wishlist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
