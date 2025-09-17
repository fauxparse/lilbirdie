import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground file:border-0 file:bg-transparent file:font-medium focus-visible:outline-none focus-visible:border-input-focus focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        small: "h-8 px-2 py-1 text-xs file:text-xs",
        medium: "h-10 px-3 py-2 text-sm file:text-sm",
        large: "h-12 px-4 py-3 text-base file:text-base",
      },
    },
    defaultVariants: {
      size: "medium",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  htmlSize?: number;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, htmlSize, ...props }, ref) => {
    return (
      <input
        type={type}
        size={htmlSize}
        className={cn(inputVariants({ size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
