import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { prisma } from "./db";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "fallback-secret-for-dev",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 10,
      roles: {
        // Wishlist owner - full control
        owner: {
          permissions: [
            "wishlists:read",
            "wishlists:write",
            "wishlists:delete",
            "wishlists:share",
            "items:read",
            "items:write",
            "items:delete",
            "items:move",
            "items:claim",
            "friends:invite",
            "friends:manage",
            "members:invite",
            "members:remove",
          ],
        },
        // Collaborator - can edit but not delete/share
        collaborator: {
          permissions: [
            "wishlists:read",
            "wishlists:write",
            "items:read",
            "items:write",
            "items:move",
            "items:claim",
          ],
        },
        // Friend - can view and claim items
        friend: {
          permissions: ["wishlists:read", "items:read", "items:claim"],
        },
        // Viewer - read-only access
        viewer: {
          permissions: ["wishlists:read", "items:read"],
        },
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
