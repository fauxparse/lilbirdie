"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SidebarTrigger } from "@/components/ui/Sidebar";
import { signOut } from "@/lib/auth-client";

export function AppHeader() {
  const { user, isLoading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="self-stretch flex h-16 shrink-0 items-center gap-2 px-4 border-b">
      <SidebarTrigger className="-ml-1" />

      <div className="flex items-center gap-2 flex-1">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🐦</span>
          <h1 className="text-lg font-semibold">Lil Birdie</h1>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        {isLoading ? (
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        ) : user ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || "User"}
                  className="h-full w-full rounded-full"
                />
              ) : (
                <div className="h-full w-full rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </Avatar>
            <span className="hidden sm:inline-block text-sm font-medium">{user.name}</span>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              Sign Out
            </Button>
          </div>
        ) : (
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
