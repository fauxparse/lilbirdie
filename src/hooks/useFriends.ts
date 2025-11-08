import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";

export interface Friend {
  id: string;
  name: string;
  image?: string;
  visibleWishlistCount: number;
}

export interface FriendRequest {
  id: string;
  createdAt: string;
  type: "incoming" | "outgoing";
  requester?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  email?: string;
}

export interface UserSearchResult {
  id: string;
  name: string | null;
  image: string | null;
  friendshipStatus: "none" | "friends" | "pending_sent" | "pending_received";
}

export function useFriends(initialData?: Friend[]) {
  const { user, isLoading: isAuthLoading } = useAuth();

  return useQuery({
    queryKey: ["friends", user?.id],
    queryFn: async (): Promise<Friend[]> => {
      const response = await fetch("/api/friends");
      if (!response.ok) {
        if (response.status === 401) {
          return [];
        }
        throw new Error("Failed to fetch friends");
      }
      return response.json();
    },
    enabled: !isAuthLoading && !!user,
    initialData,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
}

export function useFriendRequests(initialData?: FriendRequest[]) {
  const { user, isLoading: isAuthLoading } = useAuth();

  return useQuery({
    queryKey: ["friend-requests", user?.id],
    queryFn: async (): Promise<FriendRequest[]> => {
      const response = await fetch("/api/friend-requests");
      if (!response.ok) {
        if (response.status === 401) {
          return [];
        }
        throw new Error("Failed to fetch friend requests");
      }
      return response.json();
    },
    enabled: !isAuthLoading && !!user,
    initialData,
    staleTime: 30 * 1000, // 30 seconds for more frequent updates
    retry: 1,
  });
}

export function useUserSearch(query: string) {
  const { user, isLoading: isAuthLoading } = useAuth();

  return useQuery({
    queryKey: ["user-search", query],
    queryFn: async (): Promise<UserSearchResult[]> => {
      if (!query.trim() || query.trim().length < 2) {
        return [];
      }

      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("Failed to search users");
      }
      return response.json();
    },
    enabled: !isAuthLoading && !!user && query.trim().length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}/friendship`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Failed to send friend request");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate friend requests to show the new outgoing request
      queryClient.invalidateQueries({ queryKey: ["friend-requests", user?.id] });
    },
  });
}

export function useHandleFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      requestId,
      action,
    }: {
      requestId: string;
      action: "accept" | "ignore";
    }) => {
      const response = await fetch(`/api/friend-requests/${requestId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Failed to handle friend request");
      }

      return response.json();
    },
    onSuccess: (_data, { action }) => {
      // Invalidate friend requests to remove the processed request
      queryClient.invalidateQueries({ queryKey: ["friend-requests", user?.id] });

      // If accepted, also invalidate friends list to show the new friend
      if (action === "accept") {
        queryClient.invalidateQueries({ queryKey: ["friends", user?.id] });
      }
    },
  });
}

export function useCancelFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await fetch(`/api/friend-requests/${requestId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Failed to cancel friend request");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate friend requests to remove the cancelled request
      queryClient.invalidateQueries({ queryKey: ["friend-requests", user?.id] });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (friendId: string) => {
      const response = await fetch(`/api/users/${friendId}/friendship`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Failed to remove friend");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate friends list to remove the friend
      queryClient.invalidateQueries({ queryKey: ["friends", user?.id] });
    },
  });
}
