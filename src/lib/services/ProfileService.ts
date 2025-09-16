import { Profile } from "@/types";
import { prisma } from "../db";

export class ProfileService {
  private static instance: ProfileService;

  private constructor() {}

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  async getOrCreateProfile(userId: string) {
    let profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          userId,
          theme: "system",
          preferredCurrency: "NZD",
        },
      });
    }

    return profile;
  }

  async updateTheme(userId: string, theme: string) {
    const profile = await this.getOrCreateProfile(userId);

    return await prisma.profile.update({
      where: { id: profile.id },
      data: { theme },
    });
  }

  async getProfile(userId: string) {
    return await prisma.profile.findUnique({
      where: { userId },
    });
  }

  async updateProfile(userId: string, data: Partial<Profile>) {
    const profile = await this.getOrCreateProfile(userId);

    return await prisma.profile.update({
      where: { id: profile.id },
      data,
    });
  }

  async updatePreferredCurrency(userId: string, currency: string) {
    const profile = await this.getOrCreateProfile(userId);

    return await prisma.profile.update({
      where: { id: profile.id },
      data: { preferredCurrency: currency },
    });
  }
}
