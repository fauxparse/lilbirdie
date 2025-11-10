import { OccasionType } from "@prisma/client";
import { add, set } from "date-fns";
import { Cake, Gem, Gift, GraduationCap, Heart, LucideIcon, TreePine } from "lucide-react";
import { GemRing } from "@/icons/GemRing";

export type OccasionDefinition = {
  label: string;
  icon: LucideIcon;
  date?: Date;
};

export const OCCASIONS: { [key in OccasionType]: OccasionDefinition } = {
  BIRTHDAY: {
    label: "Birthday",
    icon: Cake,
  },
  CHRISTMAS: {
    label: "Christmas",
    icon: TreePine,
    date: new Date(new Date().getFullYear(), 11, 25),
  },
  VALENTINES_DAY: {
    label: "Valentine’s Day",
    icon: Heart,
    date: new Date(new Date().getFullYear(), 1, 14),
  },
  GRADUATION: {
    label: "Graduation",
    icon: GraduationCap,
  },
  ANNIVERSARY: {
    label: "Anniversary",
    icon: Gem,
  },
  WEDDING: {
    label: "Wedding",
    icon: GemRing,
  },
  CUSTOM: {
    label: "Custom",
    icon: Gift,
  },
};

export const nextOccurrence = (date: Date) => {
  let nextDate = set(date, { year: new Date().getFullYear() });
  if (nextDate < new Date()) {
    nextDate = add(nextDate, { years: 1 });
  }
  return nextDate;
};
