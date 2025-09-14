"use client";
import { useAuth } from "@/components/AuthProvider";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/Sidebar";
import { useQuery } from "@tanstack/react-query";
import { Gift, Heart, Home, LayoutDashboard, Plus, User, Users } from "lucide-react";
import Link from "next/link";

interface Wishlist {
  id: string;
  title: string;
  permalink: string;
  _count: {
    items: number;
  };
}

interface Friend {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export function AppSidebar() {
  const { user } = useAuth();

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

  const {
    data: friends,
    isLoading: friendsLoading,
    error: friendsError,
  } = useQuery<Friend[]>({
    queryKey: ["friends"],
    queryFn: async () => {
      const response = await fetch("/api/friends");
      if (!response.ok) {
        throw new Error("Failed to fetch friends");
      }
      return response.json();
    },
    enabled: !!user,
  });

  return (
    <Sidebar>
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
            {isLoading && user ? (
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
                <Link href="/">
                  <Users className="h-4 w-4" />
                  <span>Manage Friends</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {friendsLoading && user ? (
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
                      <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {friend.image ? (
                          <img
                            src={friend.image}
                            alt={friend.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                      </div>
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
      </SidebarContent>
    </Sidebar>
  );
}
