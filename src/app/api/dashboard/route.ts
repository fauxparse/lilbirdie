import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OccasionService } from "@/lib/services/OccasionService";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;

    // Get user's wishlists
    const wishlists = await prisma.wishlist.findMany({
      where: {
        ownerId: currentUserId,
      },
      select: {
        id: true,
        title: true,
        permalink: true,
        isDefault: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    // Get user's friends with their claims in one optimized query
    const friends = await prisma.friendship.findMany({
      where: {
        userId: currentUserId,
      },
      select: {
        friend: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            profile: {
              select: {
                birthday: true,
              },
            },
          },
        },
      },
    });

    // Get all claims for friends' wishlists in one query to avoid N+1
    const friendIds = friends.map((f) => f.friend.id);
    const claimsForFriends = await prisma.claim.findMany({
      where: {
        userId: currentUserId,
        wishlist: {
          ownerId: { in: friendIds },
        },
      },
      select: {
        wishlist: {
          select: {
            ownerId: true,
          },
        },
        createdAt: true,
      },
    });

    // Create a map of friend ID to their latest claim date
    const friendClaimsMap = new Map<string, Date>();
    for (const claim of claimsForFriends) {
      const friendId = claim.wishlist.ownerId;
      const existingDate = friendClaimsMap.get(friendId);
      if (!existingDate || claim.createdAt > existingDate) {
        friendClaimsMap.set(friendId, claim.createdAt);
      }
    }

    // Calculate upcoming gift occasions
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const upcomingGifts = [];

    for (const { friend } of friends) {
      const lastClaimDate = friendClaimsMap.get(friend.id);

      // Check birthday
      if (friend.profile?.birthday) {
        const birthdayThisYear = new Date(friend.profile.birthday);
        birthdayThisYear.setFullYear(currentYear);

        // If birthday already passed this year, check next year
        if (birthdayThisYear < currentDate) {
          birthdayThisYear.setFullYear(currentYear + 1);
        }

        const daysUntilBirthday = Math.ceil(
          (birthdayThisYear.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Show birthdays within the next 60 days
        if (daysUntilBirthday <= 60) {
          const lastBirthday = new Date(friend.profile.birthday);
          lastBirthday.setFullYear(birthdayThisYear.getFullYear() - 1);

          // Check if claimed since last birthday
          if (!lastClaimDate || lastClaimDate < lastBirthday) {
            upcomingGifts.push({
              friend,
              occasion: "birthday" as const,
              daysUntil: daysUntilBirthday,
              date: birthdayThisYear.toISOString(),
            });
          }
        }
      }

      // Check Christmas (December 25)
      const christmasThisYear = new Date(currentYear, 11, 25); // Month is 0-indexed

      // If Christmas already passed this year, check next year
      if (christmasThisYear < currentDate) {
        christmasThisYear.setFullYear(currentYear + 1);
      }

      const daysUntilChristmas = Math.ceil(
        (christmasThisYear.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Show Christmas within the next 60 days
      if (daysUntilChristmas <= 60) {
        const lastChristmas = new Date(christmasThisYear.getFullYear() - 1, 11, 25);

        // Check if claimed since last Christmas
        if (!lastClaimDate || lastClaimDate < lastChristmas) {
          upcomingGifts.push({
            friend,
            occasion: "christmas" as const,
            daysUntil: daysUntilChristmas,
            date: christmasThisYear.toISOString(),
          });
        }
      }
    }

    // Sort upcoming gifts by days until occasion
    upcomingGifts.sort((a, b) => a.daysUntil - b.daysUntil);

    // Get upcoming occasions
    const upcomingOccasions = await OccasionService.getInstance().getUpcomingOccasions(
      currentUserId,
      2
    );

    // Get claimed gifts that haven't been sent
    const claimedGifts = await prisma.claim.findMany({
      where: {
        userId: currentUserId,
      },
      select: {
        id: true,
        createdAt: true,
        sent: true,
        item: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrl: true,
            wishlist: {
              select: {
                id: true,
                title: true,
                owner: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      wishlists,
      upcomingGifts,
      upcomingOccasions,
      claimedGifts,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
