"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import type { DashboardData } from "@/lib/server/data-fetchers";
import { Wishlists } from "../Wishlists";

interface MyListsProps {
  initialData: DashboardData;
}

export function MyLists({ initialData }: MyListsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasOpenedModalRef = useRef(false);

  // Use React Query to manage wishlists data with server data as initial data
  const { data: dashboardData = initialData } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      return response.json();
    },
    initialData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check if we should open the new wishlist modal (only once)
  useEffect(() => {
    const openModal = searchParams.get("openModal");
    if (openModal === "new" && !hasOpenedModalRef.current) {
      hasOpenedModalRef.current = true;
      // First, clear the query param from the URL
      // Use window.history.replaceState for immediate effect
      window.history.replaceState({}, "", "/wishlists");
      // Then navigate to the modal route
      setTimeout(() => {
        router.push("/wishlists/new");
      }, 10);
    }
  }, [searchParams, router]);

  const { wishlists } = dashboardData;

  return (
    <div className="space-y-6 @container">
      <Wishlists lists={wishlists}>
        {wishlists.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No wishlists yet</p>
            <Button asChild size="small">
              <Link href="/wishlists/new">Create Your First Wishlist</Link>
            </Button>
          </div>
        ) : (
          <Link
            href="/wishlists/new"
            className="flex flex-col gap-3 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
          >
            <div className="w-full hover:bg-muted rounded-lg flex items-center justify-center border-3 border-dashed border-border aspect-square">
              <Plus className="size-10 " />
            </div>
            <div className="text-lg font-medium">Add a list</div>
          </Link>
        )}
      </Wishlists>
    </div>
  );
}
