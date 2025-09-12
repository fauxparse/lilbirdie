"use client";

import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { useSidebar } from "@/components/ui/WorkingSidebar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { open } = useSidebar();

  return (
    <>
      <AppSidebar />
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        open ? "pl-64" : "pl-0"
      )}>
        <AppHeader />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </>
  );
}