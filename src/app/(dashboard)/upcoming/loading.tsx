import { ProfileCard } from "@/components/ui/ProfileCard";

/**
 * Loading state for the upcoming occasions page.
 * Displays skeleton cards in the same responsive grid layout as the real content.
 */
export default function UpcomingLoading() {
  return (
    <div className="@container space-y-6">
      <div className="space-y-3 grid grid-cols-1 @2xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4 gap-4">
        {/* Upcoming occasion skeletons (typical count: 6-8 upcoming occasions) */}
        {Array.from({ length: 6 }).map((_, i) => (
          <ProfileCard.Skeleton key={i} />
        ))}
      </div>
    </div>
  );
}
