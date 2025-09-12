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
} from "@/components/ui/WorkingSidebar";
import { Gift, Heart, Home, Plus, User, Users } from "lucide-react";
import Link from "next/link";

// Dummy data - replace with real data later
const dummyWishlists = [
  { id: "1", title: "Birthday Wishlist", itemCount: 12 },
  { id: "2", title: "Holiday Gifts", itemCount: 8 },
  { id: "3", title: "Wedding Registry", itemCount: 25 },
  { id: "4", title: "Baby Shower", itemCount: 15 },
];

const dummyFriends = [
  { id: "1", name: "Sarah Johnson", avatar: null },
  { id: "2", name: "Mike Chen", avatar: null },
  { id: "3", name: "Emily Rodriguez", avatar: null },
  { id: "4", name: "David Kim", avatar: null },
  { id: "5", name: "Jessica Taylor", avatar: null },
];

export function AppSidebar() {
  const { user } = useAuth();

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
            {dummyWishlists.map((wishlist) => (
              <SidebarMenuItem key={wishlist.id}>
                <SidebarMenuButton asChild>
                  <Link href={`/wishlists/${wishlist.id}`}>
                    <Heart className="h-4 w-4" />
                    <span className="flex-1 truncate">{wishlist.title}</span>
                    <span className="text-xs text-muted-foreground">{wishlist.itemCount}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {dummyWishlists.length === 0 && (
              <SidebarMenuItem>
                <div className="px-2 py-2 text-sm text-muted-foreground">No wishlists yet</div>
              </SidebarMenuItem>
            )}
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
            {dummyFriends.map((friend) => (
              <SidebarMenuItem key={friend.id}>
                <SidebarMenuButton asChild>
                  <Link href={`/profile/${friend.id}`}>
                    <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center">
                      {friend.avatar ? (
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="h-full w-full rounded-full"
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
            ))}
            {dummyFriends.length === 0 && (
              <SidebarMenuItem>
                <div className="px-2 py-2 text-sm text-muted-foreground">No friends yet</div>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
