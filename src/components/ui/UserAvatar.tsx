import { cva, type VariantProps } from "class-variance-authority";
import { UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./Avatar";

const userAvatarVariants = cva("", {
  variants: {
    size: {
      small: "h-4 w-4",
      medium: "h-6 w-6",
      default: "h-8 w-8",
      large: "h-10 w-10",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const fallbackVariants = cva("", {
  variants: {
    size: {
      small: "text-xs",
      medium: "text-xs",
      default: "text-sm",
      large: "text-base",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const iconVariants = cva("text-muted-foreground", {
  variants: {
    size: {
      small: "h-2 w-2",
      medium: "h-3 w-3",
      default: "h-4 w-4",
      large: "h-5 w-5",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

interface User {
  id: string;
  name?: string | null;
  email?: string;
  image?: string | null;
}

interface UserAvatarProps extends VariantProps<typeof userAvatarVariants> {
  user: User | null | undefined;
  className?: string;
  fallbackClassName?: string;
  showIcon?: boolean;
}

export function UserAvatar({
  user,
  size,
  className,
  fallbackClassName,
  showIcon = true,
}: UserAvatarProps) {
  return (
    <Avatar className={cn(userAvatarVariants({ size }), className)}>
      {user?.image && <AvatarImage src={user.image} alt={user.name || user.email || "User"} />}
      <AvatarFallback className={cn(fallbackVariants({ size }), fallbackClassName)}>
        {user ? (
          (user.name || user.email || "?").charAt(0).toUpperCase()
        ) : showIcon ? (
          <UserRound className={iconVariants({ size })} />
        ) : (
          "?"
        )}
      </AvatarFallback>
    </Avatar>
  );
}
