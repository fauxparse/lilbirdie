import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CardBaseProps {
  children?: React.ReactNode;
  className?: string;
  href?: Route | string;
  isLoading?: boolean;
  loadingSkeleton?: React.ReactNode;
  asChild?: boolean;
}

/**
 * Base card component with hover effects, optional navigation, and loading state.
 *
 * Features:
 * - Hover effects: shadow and background color change
 * - Optional Link wrapper for navigation
 * - Skeletal loading state
 * - Negative margin trick for seamless hover area expansion
 */
export function CardBase({
  children,
  className,
  href,
  isLoading = false,
  loadingSkeleton,
  asChild = false,
}: CardBaseProps) {
  const baseClasses = cn(
    "p-3 -m-3 hover:shadow-sm bg-transparent hover:bg-background-hover rounded-xl transition-all duration-300",
    className
  );

  if (isLoading && loadingSkeleton) {
    return <div className={baseClasses}>{loadingSkeleton}</div>;
  }

  if (asChild) {
    return <div className={baseClasses}>{children}</div>;
  }

  if (href) {
    return (
      <Link href={href as Route} className={baseClasses}>
        {children}
      </Link>
    );
  }

  return <div className={baseClasses}>{children}</div>;
}
