"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { SidebarTrigger } from "@/components/ui/Sidebar";
import { UserAvatar } from "@/components/ui/UserAvatar";

export function AppHeader() {
  const { user, isLoading } = useAuth();

  return (
    <header className="self-stretch flex h-16 shrink-0 items-center gap-2 px-4 border-b">
      <div className="flex items-center gap-2 flex-1">
        <Link href="/" className="flex items-center gap-2">
          <h1 className="text-xl font-medium">Lil Birdie</h1>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        {isLoading ? (
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        ) : user ? (
          <div className="flex items-center gap-2">
            <UserAvatar
              user={user}
              size="default"
              fallbackClassName="font-medium"
              showIcon={false}
            />
            <span className="hidden sm:inline-block text-sm font-medium">{user.name}</span>
          </div>
        ) : (
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        )}
        <SidebarTrigger />
      </div>
    </header>
  );
}
