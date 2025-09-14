import { auth } from "@/lib/auth";
import { OccasionService } from "@/lib/services/OccasionService";
import type { EntityType, OccasionType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const occasion = await OccasionService.getOccasionById(id, session.user.id);

    if (!occasion) {
      return NextResponse.json({ error: "Occasion not found" }, { status: 404 });
    }

    return NextResponse.json(occasion);
  } catch (error) {
    console.error("Error fetching occasion:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, date, type, isRecurring, startYear, entityType, entityId, description } = body;

    // Validate date format if provided
    let parsedDate: Date | undefined;
    if (date) {
      parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
      }
    }

    // Validate start year for birthdays if provided
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

    const occasion = await OccasionService.updateOccasion(id, session.user.id, {
      title: title?.trim(),
      date: parsedDate,
      type: type as OccasionType | undefined,
      isRecurring,
      startYear: startYear ? Number.parseInt(startYear, 10) : undefined,
      entityType: entityType as EntityType | undefined,
      entityId: entityId || undefined,
      description: description?.trim(),
    });

    if (!occasion) {
      return NextResponse.json({ error: "Occasion not found" }, { status: 404 });
    }

    return NextResponse.json(occasion);
  } catch (error) {
    console.error("Error updating occasion:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await OccasionService.deleteOccasion(id, session.user.id);

    if (!deleted) {
      return NextResponse.json({ error: "Occasion not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting occasion:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
