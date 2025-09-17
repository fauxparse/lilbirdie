import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ProfileService } from "@/lib/services/ProfileService";

export async function POST(request: NextRequest) {
  try {
    // Get the session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { theme } = body;

    // Validate theme value
    if (!["light", "dark", "system"].includes(theme)) {
      return NextResponse.json({ error: "Invalid theme value" }, { status: 400 });
    }

    // Update user's theme in their profile
    await ProfileService.getInstance().updateTheme(session.user.id, theme);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user theme:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
