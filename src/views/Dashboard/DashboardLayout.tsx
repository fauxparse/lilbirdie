"use client";

import { Calendar, Heart, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ProfileCard } from "@/components/ui/ProfileCard";
import { ProfileHeader } from "@/components/ui/ProfileHeader";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { WishlistCard } from "@/components/WishlistCard";
import type { User } from "@/lib/auth";
import type { UserProfileData } from "@/lib/server/data-fetchers";
import { cn } from "@/lib/utils";
import { FriendCard } from "../Friends/FriendCard";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
}

const tabs = [
  {
    name: "My Lists",
    href: "/wishlists" as const,
    icon: Heart,
    description: "Your wishlists and items",
  },
  {
    name: "Friends",
    href: "/friends" as const,
    icon: Users,
    description: "Manage friends and requests",
  },
  {
    name: "Coming Up",
    href: "/upcoming" as const,
    icon: Calendar,
    description: "Upcoming gift occasions",
  },
];

function WishlistsSkeleton() {
  return (
    <div className="space-y-6 @container">
      <ResponsiveGrid>
        {Array.from({ length: 4 }).map((_, i) => (
          <WishlistCard.Skeleton key={i} />
        ))}
      </ResponsiveGrid>
    </div>
  );
}

function FriendsSkeleton() {
  return (
    <div className="@container">
      <div className="grid grid-cols-1 @2xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4 gap-4">
        <ProfileCard.Skeleton />
        {Array.from({ length: 7 }).map((_, i) => (
          <FriendCard.Skeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function UpcomingSkeleton() {
  return (
    <div className="@container space-y-6">
      <div className="space-y-3 grid grid-cols-1 @2xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProfileCard.Skeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetTab, setTargetTab] = useState<string | null>(null);

  // Create a profile structure for the current user's dashboard
  const profile: UserProfileData = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    },
    friendshipStatus: "none",
    wishlists: [],
    isOwnProfile: true,
  };

  const handleTabClick = (href: string) => {
    if (href === pathname) return;

    setTargetTab(href);
    setIsNavigating(true);
    startTransition(() => {
      router.push(href as "/wishlists" | "/friends" | "/upcoming");
      // Reset loading state after a short delay to allow for smooth transition
      setTimeout(() => {
        setIsNavigating(false);
        setTargetTab(null);
      }, 100);
    });
  };

  const renderSkeleton = () => {
    if (!targetTab) return <WishlistsSkeleton />;

    if (targetTab === "/friends") {
      return <FriendsSkeleton />;
    } else if (targetTab === "/upcoming") {
      return <UpcomingSkeleton />;
    } else {
      return <WishlistsSkeleton />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 container-type-inline-size">
      <div className="space-y-6">
        <ProfileHeader profile={profile} title={user.name || "Dashboard"}>
          {/* Tab Navigation */}
          <nav className="mt-6 flex space-x-8 justify-center border-t border-border">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;

              return (
                <button
                  key={tab.name}
                  type="button"
                  onClick={() => handleTabClick(tab.href)}
                  disabled={isPending || isNavigating}
                  className={cn(
                    "group inline-flex items-center gap-2 py-4 px-1 -mt-px border-t-1 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                  )}
                >
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </ProfileHeader>

        {/* Tab Content */}
        <div className="mt-6">{isPending || isNavigating ? renderSkeleton() : children}</div>
      </div>
    </div>
  );
}
