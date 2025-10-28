import { notFound } from "next/navigation";
import { fetchUserProfile } from "@/lib/server/data-fetchers";
import { UserProfileClient } from "./UserProfileClient";

interface UserProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { userId } = await params;

  // Fetch user profile data on the server
  const profileResult = await fetchUserProfile(userId);

  if (!profileResult.success) {
    if (profileResult.statusCode === 404) {
      notFound();
    }
    // For other errors, we'll let the client handle them
    return <UserProfileClient userId={userId} initialData={null} />;
  }

  return <UserProfileClient userId={userId} initialData={profileResult.data} />;
}
