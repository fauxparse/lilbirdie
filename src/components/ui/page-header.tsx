import * as React from "react";
import { cn } from "@/lib/utils";

const PageHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col items-start gap-2 pb-8", className)} {...props}>
      {children}
    </div>
  )
);
PageHeader.displayName = "PageHeader";

const PageHeaderHeading = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h1
    ref={ref}
    className={cn(
      "text-2xl font-medium leading-tight tracking-tighter md:text-3xl lg:text-4xl pt-8 md:pt-10 lg:pt-12",
      className
    )}
    {...props}
  />
));
PageHeaderHeading.displayName = "PageHeaderHeading";

const PageHeaderDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("max-w-2xl text-md text-muted-foreground", className)} {...props} />
));
PageHeaderDescription.displayName = "PageHeaderDescription";

const PageActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex w-full items-center justify-start gap-2 pt-2", className)}
      {...props}
    />
  )
);
PageActions.displayName = "PageActions";

export { PageHeader, PageHeaderHeading, PageHeaderDescription, PageActions };
