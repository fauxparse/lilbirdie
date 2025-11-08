import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type PolymorphicProps<C extends ElementType> = {
  as?: C;
  avatar: ReactNode;
  primaryText: ReactNode;
  secondaryText?: ReactNode;
  actions?: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<C>, "as">;

type ProfileCardProps<C extends ElementType = "div"> = PolymorphicProps<C>;

/**
 * ProfileCard - A reusable card component for displaying profile information
 * with avatar, text content, and optional actions.
 *
 * Features:
 * - Polymorphic: Can render as Link, button, div, or any HTML element
 * - 3-column grid layout with row-spanning avatar
 * - Hover effects
 * - Flexible action area for buttons
 *
 * @example
 * // As a Link
 * <ProfileCard
 *   as={Link}
 *   href="/profile"
 *   avatar={<UserAvatar />}
 *   primaryText="John Doe"
 *   secondaryText="3 lists"
 * />
 *
 * @example
 * // As a button with actions
 * <ProfileCard
 *   as="button"
 *   onClick={handleClick}
 *   avatar={<UserAvatar />}
 *   primaryText="Friend Request"
 *   secondaryText="2 days ago"
 *   actions={<>
 *     <Button>Accept</Button>
 *     <Button>Ignore</Button>
 *   </>}
 * />
 */
export function ProfileCard<C extends ElementType = "div">({
  as,
  avatar,
  primaryText,
  secondaryText,
  actions,
  className,
  ...props
}: ProfileCardProps<C>) {
  const Component = as || "div";

  return (
    <Component
      className={cn(
        "grid grid-cols-[auto_1fr_1fr] grid-rows-[auto_auto] gap-2 hover:bg-muted p-3 rounded-xl items-center",
        // Add cursor-pointer and text-left for interactive elements
        (as === "button" || props.onClick) && "cursor-pointer text-left",
        className
      )}
      {...props}
    >
      <div className="row-[1/span_2] w-17 h-17 mr-2 [&>*]:w-full [&>*]:h-full">{avatar}</div>
      <div className="col-span-2 last:row-span-2">
        {primaryText}
        {secondaryText}
      </div>
      {actions}
    </Component>
  );
}
