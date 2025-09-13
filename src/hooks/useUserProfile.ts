import { useAuth } from "@/components/AuthProvider";
import { useQuery } from "@tanstack/react-query";

export interface UserProfile {
  id: string;
  userId: string;
  birthday?: string;
  preferredCurrency: string;
  theme: string;
  createdAt: string;
  updatedAt: string;
}

export function useUserProfile() {
  const { user, isLoading: isAuthLoading } = useAuth();

  return useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null;

      const response = await fetch("/api/user/profile");
      if (!response.ok) {
        if (response.status === 401) {
          return null; // User not authenticated
        }
        throw new Error("Failed to fetch user profile");
      }

      return response.json();
    },
    enabled: !isAuthLoading && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
