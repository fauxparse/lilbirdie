import { auth } from "@/lib/auth";
import { OccasionService } from "@/lib/services/OccasionService";
import type { EntityType, OccasionType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const upcoming = searchParams.get("upcoming");

    if (upcoming === "true") {
      const months = Number.parseInt(searchParams.get("months") || "3", 10);
      const occasions = await OccasionService.getUpcomingOccasions(session.user.id, months);
      return NextResponse.json(occasions);
    }

    const occasions = await OccasionService.getUserOccasions(session.user.id);
    return NextResponse.json(occasions);
  } catch (error) {
    console.error("Error fetching occasions:", error);
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

    const body = await request.json();
    const { title, date, type, isRecurring, startYear, entityType, entityId, description } = body;

    if (!title || title.trim() === "") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: "Type is required" }, { status: 400 });
    }

    // Validate date format
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    // Validate start year for birthdays
    if (
      type === "BIRTHDAY" &&
      startYear &&
      (startYear < 1900 || startYear > new Date().getFullYear())
    ) {
      return NextResponse.json({ error: "Invalid start year" }, { status: 400 });
    }

    // Validate entity type and ID consistency
    if ((entityType && !entityId) || (!entityType && entityId)) {
      return NextResponse.json(
        { error: "Entity type and entity ID must be provided together" },
        { status: 400 }
      );
    }

    const occasion = await OccasionService.createOccasion(session.user.id, {
      title: title.trim(),
      date: parsedDate,
      type: type as OccasionType,
      isRecurring: isRecurring !== false, // Default to true
      startYear: startYear ? Number.parseInt(startYear, 10) : undefined,
      entityType: entityType as EntityType | undefined,
      entityId: entityId || undefined,
      description: description?.trim(),
    });

    return NextResponse.json(occasion, { status: 201 });
  } catch (error) {
    console.error("Error creating occasion:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
