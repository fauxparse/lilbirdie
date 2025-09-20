"use client";

import { useFriendRealtime } from "@/hooks/useFriendRealtime";

export function RealTimeManager() {
  // Enable friend real-time notifications
  useFriendRealtime();

  // This component doesn't render anything, it just manages real-time subscriptions
  return null;
}
