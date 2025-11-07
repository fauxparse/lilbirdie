import { $Enums } from "@prisma/client";
import { ChevronDown, Eye, EyeOff, LucideIcon, Users } from "lucide-react";
import { forwardRef } from "react";
import { Badge, BadgeProps } from "./Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./DropdownMenu";

interface ReadOnlyPrivacyBadgeProps extends BadgeProps {
  privacy: $Enums.WishlistPrivacy;
}

interface PrivacyBadgeProps extends Omit<ReadOnlyPrivacyBadgeProps, "onChange"> {
  readOnly?: boolean;
  onChange?: (privacy: $Enums.WishlistPrivacy) => void;
}

export const privacyLabels: Record<$Enums.WishlistPrivacy, string> = {
  PUBLIC: "Public",
  FRIENDS_ONLY: "Friends only",
  PRIVATE: "Private",
} as const;

export const privacyDescriptions: Record<$Enums.WishlistPrivacy, string> = {
  PUBLIC: "Anyone with the link",
  FRIENDS_ONLY: "Only your friends",
  PRIVATE: "Only you",
} as const;

export const privacyIcons: Record<$Enums.WishlistPrivacy, LucideIcon> = {
  PUBLIC: Eye,
  FRIENDS_ONLY: Users,
  PRIVATE: EyeOff,
} as const;

const ReadOnlyPrivacyBadge = forwardRef<HTMLDivElement, ReadOnlyPrivacyBadgeProps>(
  ({ privacy, children, ...props }, ref) => {
    return (
      <Badge ref={ref} variant="outline" {...props}>
        <span>{privacyLabels[privacy]}</span>
        {children}
      </Badge>
    );
  }
);

export const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({
  privacy,
  readOnly,
  onChange,
  ...props
}) => {
  if (readOnly || !onChange) {
    return <ReadOnlyPrivacyBadge privacy={privacy} {...props} />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ReadOnlyPrivacyBadge className="cursor-pointer" privacy={privacy} {...props}>
          <ChevronDown className="h-4 w-4 ml-1 -mr-1 text-muted-foreground" />
        </ReadOnlyPrivacyBadge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {(Object.entries(privacyLabels) as [[$Enums.WishlistPrivacy, string]]).map(
          ([privacy, label]) => (
            <DropdownMenuItem key={privacy} onClick={() => onChange(privacy)}>
              <span>{label}</span>
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
