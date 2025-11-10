import { Occasion } from "@prisma/client";
import { format } from "date-fns";
import { forwardRef } from "react";
import { nextOccurrence, OCCASIONS } from "@/lib/occasions";
import { Badge, BadgeProps } from "./Badge";

interface OccasionBadgeProps extends BadgeProps {
  occasion: Occasion;
}

export const OccasionBadge = forwardRef<HTMLDivElement, OccasionBadgeProps>(
  ({ occasion, children, ...props }, ref) => {
    const Icon = OCCASIONS[occasion.type].icon;

    const nextDate = nextOccurrence(occasion.date);
    const age = nextDate.getFullYear() - occasion.date.getFullYear();

    return (
      <Badge ref={ref} variant="outline" {...props}>
        <Icon className="h-4 w-4" />
        <span>
          {occasion.type === "CUSTOM" && `${occasion.title} `}
          {format(occasion.date, "d LLL")}
          {occasion.type === "BIRTHDAY" && ` (${age})`}
        </span>
        {children}
      </Badge>
    );
  }
);
