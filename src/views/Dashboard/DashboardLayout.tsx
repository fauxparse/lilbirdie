"use client";

import { Calendar, Heart, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { User } from "@/lib/auth";
import { cn } from "@/lib/utils";

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

function TabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 cq-lg:grid-cols-2">
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
  );
}

function FriendsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-1">
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
  );
}

function UpcomingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 cq-lg:grid-cols-2">
        <div className="h-80 bg-muted animate-pulse rounded-lg" />
        <div className="h-80 bg-muted animate-pulse rounded-lg" />
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
    if (!targetTab) return <TabSkeleton />;

    if (targetTab === "/friends") {
      return <FriendsSkeleton />;
    } else if (targetTab === "/upcoming") {
      return <UpcomingSkeleton />;
    } else {
      return <TabSkeleton />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 container-type-inline-size">
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <UserAvatar user={user} size="huge" />
          <h1 className="text-3xl font-medium text-center">{user.name || "Dashboard"}</h1>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-border">
          <nav className="-mt-px flex space-x-8 justify-center">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;

              return (
                <button
                  key={tab.name}
                  type="button"
                  onClick={() => handleTabClick(tab.href)}
                  disabled={isPending || isNavigating}
                  className={cn(
                    "group inline-flex items-center gap-2 py-4 px-1 border-t-1 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
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
        </div>

        {/* Tab Content */}
        <div className="mt-6">{isPending || isNavigating ? renderSkeleton() : children}</div>
      </div>
    </div>
  );
}
