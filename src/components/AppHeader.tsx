"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useIsMounted } from "@/hooks/useIsMounted";

export function AppHeader() {
  const { user, isLoading } = useAuth();
  const mounted = useIsMounted();

  return (
    <header className="border-b sticky top-0 z-10 bg-background">
      <div className="container flex items-center justify-between mx-auto px-4 py-2">
        <div className="flex items-center gap-2 flex-1">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-3xl">Lil Birdie</h1>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!mounted || isLoading ? (
            <div className="h-10 w-10 rounded-full squircle bg-muted animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <UserAvatar
                user={user}
                size="large"
                fallbackClassName="font-medium"
                showIcon={false}
              />
            </div>
          ) : (
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
