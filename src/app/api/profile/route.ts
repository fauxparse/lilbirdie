import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ProfileService } from "@/lib/services/ProfileService";
import { Profile } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await ProfileService.getInstance().getOrCreateProfile(session.user.id);

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { preferredCurrency, theme } = body;

    const updates: Partial<Profile> = {};

    if (preferredCurrency) {
      updates.preferredCurrency = preferredCurrency;
    }

    if (theme) {
      updates.theme = theme;
    }

    const updatedProfile = await ProfileService.getInstance().updateProfile(
      session.user.id,
      updates
    );
    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
