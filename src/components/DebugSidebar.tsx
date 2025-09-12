"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { Heart, Home, Plus, Users, User, Gift } from "lucide-react";

// Dummy data - same as before
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

export function DebugSidebar() {
  const { user } = useAuth();

  return (
    <div className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 p-4">
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Debug Sidebar</h2>
        <p className="text-sm text-gray-600">This should be visible</p>
      </div>

      {/* Navigation */}
      <div className="mb-6">
        <nav className="space-y-2">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100">
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <Link href="/wishlists/new" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100">
            <Plus className="h-4 w-4" />
            <span>Create Wishlist</span>
          </Link>
        </nav>
      </div>

      {/* My Wishlists */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">My Wishlists</h3>
        <nav className="space-y-1">
          {dummyWishlists.map((wishlist) => (
            <Link 
              key={wishlist.id}
              href={`/wishlists/${wishlist.id}`}
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
            >
              <Heart className="h-4 w-4" />
              <span className="flex-1 truncate">{wishlist.title}</span>
              <span className="text-xs text-gray-500">{wishlist.itemCount}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Friends */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Friends</h3>
        <nav className="space-y-1">
          <Link href="/friends" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 text-sm">
            <Users className="h-4 w-4" />
            <span>Manage Friends</span>
          </Link>
          {dummyFriends.slice(0, 3).map((friend) => (
            <Link 
              key={friend.id}
              href={`/profile/${friend.id}`}
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
            >
              <div className="h-4 w-4 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="h-3 w-3" />
              </div>
              <span className="truncate">{friend.name}</span>
              <Gift className="h-3 w-3 text-gray-400" />
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}