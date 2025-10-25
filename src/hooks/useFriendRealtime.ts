import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { useSocketContext } from "@/contexts/SocketContext";

export function useFriendRealtime() {
  const queryClient = useQueryClient();
  const { on, off, isConnected } = useSocketContext();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !isConnected) {
      return;
    }

    // Define event handlers for friend-related real-time updates
    const handleFriendRequest = (_data: Record<string, unknown>) => {
      // Invalidate friend requests query to show new request
      queryClient.invalidateQueries({
        queryKey: ["friend-requests", user.id],
      });

      // Show a toast notification for new friend request
      toast.info("You have a new friend request!", {
        description: "Check your notifications to respond.",
        duration: 5000,
      });
    };

    const handleFriendAccepted = (_data: Record<string, unknown>) => {
      // Invalidate both friends and friend requests queries
      queryClient.invalidateQueries({
        queryKey: ["friends", user.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["friend-requests", user.id],
      });

      // Show a toast notification for accepted friend request
      toast.success("Friend request accepted!", {
        description: "You are now friends and can see each other's wishlists.",
        duration: 5000,
      });
    };

    // Register event listeners
    on("friend:request", handleFriendRequest);
    on("friend:accepted", handleFriendAccepted);

    // Cleanup function
    return () => {
      // Unregister event listeners
      off("friend:request", handleFriendRequest);
      off("friend:accepted", handleFriendAccepted);
    };
  }, [user, isConnected, on, off, queryClient]);
}
