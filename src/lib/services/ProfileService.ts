import { prisma } from "../db";

export class ProfileService {
  static async getOrCreateProfile(userId: string) {
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

  static async updateTheme(userId: string, theme: string) {
    const profile = await ProfileService.getOrCreateProfile(userId);

    return await prisma.profile.update({
      where: { id: profile.id },
      data: { theme },
    });
  }

  static async getProfile(userId: string) {
    return await prisma.profile.findUnique({
      where: { userId },
    });
  }

  static async updatePreferredCurrency(userId: string, currency: string) {
    const profile = await ProfileService.getOrCreateProfile(userId);

    return await prisma.profile.update({
      where: { id: profile.id },
      data: { preferredCurrency: currency },
    });
  }
}
