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
          preferredCurrency: "USD",
        },
      });
    }

    return profile;
  }

  static async updateTheme(userId: string, theme: string) {
    const profile = await this.getOrCreateProfile(userId);

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
}