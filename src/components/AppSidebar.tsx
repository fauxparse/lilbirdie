"use client";

import { useQuery } from "@tanstack/react-query";
import { Gift, Heart, Home, LayoutDashboard, LogOut, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/Sidebar";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useFriends } from "@/hooks/useFriends";
import { signOut } from "@/lib/auth-client";

interface Wishlist {
  id: string;
  title: string;
  permalink: string;
  _count: {
    items: number;
  };
}

export function AppSidebar() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: wishlists,
    isLoading,
    error,
  } = useQuery<Wishlist[]>({
    queryKey: ["wishlists"],
    queryFn: async () => {
      const response = await fetch("/api/wishlists");
      if (!response.ok) {
        throw new Error("Failed to fetch wishlists");
      }
      return response.json();
    },
    enabled: !!user,
  });

  const { data: friends, isLoading: friendsLoading, error: friendsError } = useFriends();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar side="right">
      <SidebarContent>
        {/* Navigation Section */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/wishlists/new">
                  <Plus className="h-4 w-4" />
                  <span>Create Wishlist</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* My Wishlists Section */}
        <SidebarGroup>
          <SidebarGroupLabel>My Wishlists</SidebarGroupLabel>
          <SidebarMenu>
            {!mounted || (isLoading && user) ? (
              // Show loading skeletons
              <>
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
              </>
            ) : error ? (
              <SidebarMenuItem>
                <div className="px-2 py-2 text-sm text-red-500">Failed to load wishlists</div>
              </SidebarMenuItem>
            ) : wishlists && wishlists.length > 0 ? (
              wishlists.map((wishlist) => (
                <SidebarMenuItem key={wishlist.id}>
                  <SidebarMenuButton asChild>
                    <Link href={`/w/${wishlist.permalink}`}>
                      <Heart className="h-4 w-4" />
                      <span className="flex-1 truncate">{wishlist.title}</span>
                      <span className="text-xs text-muted-foreground">{wishlist._count.items}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            ) : user ? (
              <SidebarMenuItem>
                <div className="px-2 py-2 text-sm text-muted-foreground">No wishlists yet</div>
              </SidebarMenuItem>
            ) : null}
          </SidebarMenu>
        </SidebarGroup>

        {/* Friends Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Friends</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/friends">
                  <Users className="h-4 w-4" />
                  <span>Manage Friends</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {!mounted || (friendsLoading && user) ? (
              // Show loading skeletons
              <>
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
              </>
            ) : friendsError ? (
              <SidebarMenuItem>
                <div className="px-2 py-2 text-sm text-red-500">Failed to load friends</div>
              </SidebarMenuItem>
            ) : friends && friends.length > 0 ? (
              friends.map((friend) => (
                <SidebarMenuItem key={friend.id}>
                  <SidebarMenuButton asChild>
                    <Link href={`/u/${friend.id}`}>
                      <UserAvatar user={friend} size="medium" className="-m-1" />
                      <span className="truncate">{friend.name}</span>
                      <Gift className="h-3 w-3 text-muted-foreground" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            ) : user ? (
              <SidebarMenuItem>
                <div className="px-2 py-2 text-sm text-muted-foreground">No friends yet</div>
              </SidebarMenuItem>
            ) : null}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarFooter>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button type="button" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
