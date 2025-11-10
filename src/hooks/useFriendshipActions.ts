import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hook for managing friendship actions (add/remove friend)
 *
 * Handles the mutation logic for updating friendships and invalidating
 * the user profile cache on success.
 */
export function useFriendshipActions(userId: string) {
  const queryClient = useQueryClient();

  const friendshipMutation = useMutation({
    mutationFn: async (action: "add" | "remove") => {
      const method = action === "add" ? "POST" : "DELETE";
      const response = await fetch(`/api/users/${userId}/friendship`, {
        method,
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Failed to update friendship");
      }

      return response.json();
    },
    onSuccess: (_data, action) => {
      queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
      toast.success(action === "add" ? "Friend request sent!" : "Friend removed");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    addFriend: () => friendshipMutation.mutate("add"),
    removeFriend: () => friendshipMutation.mutate("remove"),
    isLoading: friendshipMutation.isPending,
  };
}
