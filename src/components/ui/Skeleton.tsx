import { cn } from "@/lib/utils";

export const Skeleton: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  <div
    data-slot="skeleton"
    className={cn("bg-accent animate-pulse rounded-md", className)}
    {...props}
  />
);
