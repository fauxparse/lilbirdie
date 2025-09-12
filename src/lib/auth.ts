import { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

const prisma = new PrismaClient();

export const auth = betterAuth({
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
  user: {
    additionalFields: {
      birthday: {
        type: "date",
        required: false,
      },
      preferredCurrency: {
        type: "string",
        defaultValue: "USD",
      },
      theme: {
        type: "string",
        defaultValue: "system",
      },
    },
  },
  emailAndPassword: {
    enabled: false, // Only using Google OAuth for now
  },
  advanced: {
    generateId: false, // Let Prisma handle ID generation with cuid()
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
