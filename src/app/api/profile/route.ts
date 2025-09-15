import { auth } from "@/lib/auth";
import { ProfileService } from "@/lib/services/ProfileService";
import { NextRequest, NextResponse } from "next/server";

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

    let updatedProfile;

    if (preferredCurrency) {
      updatedProfile = await ProfileService.getInstance().updatePreferredCurrency(
        session.user.id,
        preferredCurrency
      );
    }

    if (theme) {
      updatedProfile = await ProfileService.getInstance().updateTheme(session.user.id, theme);
    }

    // If both were provided, get the final state
    if (preferredCurrency && theme) {
      updatedProfile = await ProfileService.getInstance().getOrCreateProfile(session.user.id);
    }

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
