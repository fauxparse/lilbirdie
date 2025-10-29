import { ProfileService } from "@/lib/services/ProfileService";
import { getServerSession } from "./auth";

export type Theme = "light" | "dark" | "system";

/**
 * Get the user's theme preference from the server
 * Returns the theme from the user's profile, or "system" as default
 */
export async function getServerTheme(): Promise<Theme> {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return "system";
    }

    const profile = await ProfileService.getInstance().getProfile(session.user.id);

    if (!profile?.theme) {
      return "system";
    }

    // Validate theme value
    if (["light", "dark", "system"].includes(profile.theme)) {
      return profile.theme as Theme;
    }

    return "system";
  } catch (error) {
    console.error("Error fetching server theme:", error);
    return "system";
  }
}

/**
 * Resolve the actual theme (light/dark) from a theme preference
 * For "system" theme, we can't determine the actual preference server-side
 * so we return "system" and let the client handle it
 */
export function resolveTheme(theme: Theme): "light" | "dark" | "system" {
  if (theme === "system") {
    return "system";
  }
  return theme;
}
