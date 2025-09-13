// Extended types for Better Auth with custom user fields

export interface ExtendedUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  // Custom fields
  birthday?: string; // ISO date string
  preferredCurrency: string;
  theme: string;
}

export interface ExtendedSession {
  id: string;
  userId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  user: ExtendedUser;
}

// Theme-specific types
export type Theme = "light" | "dark" | "system";
