import type { EntityType, OccasionType } from "@prisma/client";
import { prisma } from "../db";

export interface CreateOccasionData {
  title: string;
  date: Date;
  type: OccasionType;
  isRecurring?: boolean;
  startYear?: number;
  entityType?: EntityType;
  entityId?: string;
  description?: string;
}

export interface UpdateOccasionData {
  title?: string;
  date?: Date;
  type?: OccasionType;
  isRecurring?: boolean;
  startYear?: number;
  entityType?: EntityType;
  entityId?: string;
  description?: string;
}

export class OccasionService {
  static async createOccasion(ownerId: string, data: CreateOccasionData) {
    return await prisma.occasion.create({
      data: {
        ...data,
        ownerId,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });
  }

  static async getUserOccasions(userId: string) {
    return await prisma.occasion.findMany({
      where: { ownerId: userId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { date: "asc" },
    });
  }

  static async getOccasionById(id: string, userId?: string) {
    const occasion = await prisma.occasion.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    if (!occasion) return null;

    // Check if user has access to this occasion
    if (userId && occasion.ownerId !== userId) {
      // For now, only the owner can access occasions
      // Later we might add logic for friends to see each other's occasions
      return null;
    }

    return occasion;
  }

  static async updateOccasion(id: string, userId: string, data: UpdateOccasionData) {
    const occasion = await this.getOccasionById(id, userId);
    if (!occasion || occasion.ownerId !== userId) {
      return null;
    }

    return await prisma.occasion.update({
      where: { id },
      data,
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });
  }

  static async deleteOccasion(id: string, userId: string) {
    const occasion = await this.getOccasionById(id, userId);
    if (!occasion || occasion.ownerId !== userId) {
      return false;
    }

    await prisma.occasion.delete({
      where: { id },
    });

    return true;
  }

  static async getUpcomingOccasions(userId: string, months = 3) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setMonth(now.getMonth() + months);

    // Get all occasions for the user
    const occasions = await prisma.occasion.findMany({
      where: { ownerId: userId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    // Calculate next occurrence for each occasion
    const upcomingOccasions = occasions
      .map((occasion) => {
        const nextOccurrence = this.calculateNextOccurrence(
          occasion.date,
          occasion.isRecurring,
          now
        );
        return {
          ...occasion,
          nextOccurrence,
        };
      })
      .filter((occasion) => occasion.nextOccurrence && occasion.nextOccurrence <= futureDate)
      .sort((a, b) => a.nextOccurrence!.getTime() - b.nextOccurrence!.getTime());

    return upcomingOccasions;
  }

  static calculateNextOccurrence(
    originalDate: Date,
    isRecurring: boolean,
    fromDate: Date = new Date()
  ): Date | null {
    if (!isRecurring) {
      return originalDate >= fromDate ? originalDate : null;
    }

    // For recurring events, calculate next occurrence
    const currentYear = fromDate.getFullYear();
    const originalMonth = originalDate.getMonth();
    const originalDay = originalDate.getDate();

    // Try current year first
    let nextDate = new Date(currentYear, originalMonth, originalDay);

    // If it's already passed this year, try next year
    if (nextDate < fromDate) {
      nextDate = new Date(currentYear + 1, originalMonth, originalDay);
    }

    return nextDate;
  }

  static calculateAge(birthDate: Date, startYear?: number, asOf: Date = new Date()): number | null {
    if (!startYear) return null;

    const birthYear = startYear;
    const currentYear = asOf.getFullYear();
    let age = currentYear - birthYear;

    // Check if birthday has occurred this year
    const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    if (asOf < thisYearBirthday) {
      age--;
    }

    return age;
  }

  // Helper methods for creating common occasion types
  static async createBirthdayOccasion(
    ownerId: string,
    title: string,
    birthDate: Date,
    startYear: number,
    entityType?: EntityType,
    entityId?: string
  ) {
    return this.createOccasion(ownerId, {
      title,
      date: birthDate,
      type: "BIRTHDAY",
      isRecurring: true,
      startYear,
      entityType,
      entityId,
    });
  }

  static async createAnniversaryOccasion(
    ownerId: string,
    title: string,
    anniversaryDate: Date,
    entityType?: EntityType,
    entityId?: string
  ) {
    return this.createOccasion(ownerId, {
      title,
      date: anniversaryDate,
      type: "ANNIVERSARY",
      isRecurring: true,
      entityType,
      entityId,
    });
  }

  static async createGlobalOccasion(ownerId: string, type: "CHRISTMAS" | "VALENTINES_DAY") {
    const dates = {
      CHRISTMAS: new Date(new Date().getFullYear(), 11, 25), // Dec 25
      VALENTINES_DAY: new Date(new Date().getFullYear(), 1, 14), // Feb 14
    };

    const titles = {
      CHRISTMAS: "Christmas",
      VALENTINES_DAY: "Valentine's Day",
    };

    return this.createOccasion(ownerId, {
      title: titles[type],
      date: dates[type],
      type,
      isRecurring: true,
    });
  }
}
