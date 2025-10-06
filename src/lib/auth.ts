import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { prisma } from "./db";

// Define permission statements for access control
const statement = {
  wishlists: ["read", "write", "delete", "share"],
  items: ["read", "write", "delete", "move", "claim"],
  friends: ["invite", "manage"],
  members: ["invite", "remove"],
} as const;

const ac = createAccessControl(statement);

// Define roles with their permissions
const owner = ac.newRole({
  wishlists: ["read", "write", "delete", "share"],
  items: ["read", "write", "delete", "move", "claim"],
  friends: ["invite", "manage"],
  members: ["invite", "remove"],
});

const collaborator = ac.newRole({
  wishlists: ["read", "write"],
  items: ["read", "write", "move", "claim"],
});

const friend = ac.newRole({
  wishlists: ["read"],
  items: ["read", "claim"],
});

const viewer = ac.newRole({
  wishlists: ["read"],
  items: ["read"],
});

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
      ac,
      roles: {
        owner,
        collaborator,
        friend,
        viewer,
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
