import { cn } from "@/lib/utils";

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * A responsive grid layout component that uses container queries.
 * Adjusts column count based on container width, not viewport width.
 *
 * Breakpoints:
 * - Default: 1 column
 * - @md (28rem / 448px): 2 columns
 * - @2xl (42rem / 672px): 3 columns
 * - @4xl (56rem / 896px): 4 columns
 * - @6xl (72rem / 1152px): 5 columns
 */
export function ResponsiveGrid({ children, className }: ResponsiveGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4 @6xl:grid-cols-5 gap-8 items-start",
        className
      )}
    >
      {children}
    </div>
  );
}
