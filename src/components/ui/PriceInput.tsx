import * as React from "react";
import { cn } from "@/lib/utils";
import { Input, type InputProps } from "./Input";

export interface PriceInputProps extends Omit<InputProps, "type" | "value" | "onChange"> {
  value?: number | null;
  onChange?: (value: number | null) => void;
  placeholder?: string;
}

const PriceInput = React.forwardRef<HTMLInputElement, PriceInputProps>(
  ({ className, value, onChange, placeholder = "0.00", ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const combinedRef = React.useMemo(() => {
      if (typeof ref === "function") {
        return (node: HTMLInputElement | null) => {
          inputRef.current = node;
          ref(node);
        };
      } else if (ref) {
        return (node: HTMLInputElement | null) => {
          inputRef.current = node;
          ref.current = node;
        };
      }
      return (node: HTMLInputElement | null) => {
        inputRef.current = node;
      };
    }, [ref]);

    // Update the input value when the prop value changes (but not when focused)
    React.useEffect(() => {
      if (inputRef.current && !isFocused) {
        const displayValue = value === null || value === undefined ? "" : value.toFixed(2);
        inputRef.current.value = displayValue;
      }
    }, [value, isFocused]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Allow empty string (which represents null)
      if (inputValue === "") {
        onChange?.(null);
        return;
      }

      // Remove any non-numeric characters except decimal point (including negative signs)
      const cleanValue = inputValue.replace(/[^0-9.]/g, "");

      // Prevent multiple decimal points
      const parts = cleanValue.split(".");
      if (parts.length > 2) {
        return; // Don't update if more than one decimal point
      }

      // Limit to 2 decimal places
      if (parts.length === 2 && parts[1].length > 2) {
        return; // Don't update if more than 2 decimal places
      }

      // Convert to number and validate
      const numericValue = Number.parseFloat(cleanValue);

      // Only call onChange if it's a valid number or empty string
      if (!Number.isNaN(numericValue) && numericValue >= 0) {
        onChange?.(numericValue);
      } else if (cleanValue === "") {
        onChange?.(null);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter, home, end, left, right
      if (
        [
          "Backspace",
          "Delete",
          "Tab",
          "Escape",
          "Enter",
          "Home",
          "End",
          "ArrowLeft",
          "ArrowRight",
        ].includes(e.key) ||
        // Allow: Ctrl+A/C/V/X (Windows/Linux) and Cmd+A/C/V/X (Mac)
        e.ctrlKey ||
        e.metaKey
      ) {
        return;
      }

      // When focused, allow typing digits and decimal point
      if (isFocused) {
        // Allow digits (0-9) and decimal point
        if (
          /^[0-9]$/.test(e.key) || // digits 0-9
          e.key === "." // decimal point
        ) {
          return;
        }
        // Block everything else
        e.preventDefault();
        return;
      }

      // When not focused, use the original restrictive logic
      if (e.shiftKey || (!/^[0-9]$/.test(e.key) && e.key !== ".")) {
        e.preventDefault();
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // When blurring, parse the current value and format it
      if (inputRef.current) {
        const inputValue = inputRef.current.value;
        if (inputValue === "") {
          onChange?.(null);
        } else {
          const cleanValue = inputValue.replace(/[^0-9.]/g, "");
          const numericValue = Number.parseFloat(cleanValue);
          if (!Number.isNaN(numericValue) && numericValue >= 0) {
            onChange?.(numericValue);
            // Format the display value
            inputRef.current.value = numericValue.toFixed(2);
          }
        }
      }
      props.onBlur?.(e);
    };

    return (
      <Input
        ref={combinedRef}
        type="text"
        inputMode="decimal"
        defaultValue={value === null || value === undefined ? "" : value.toFixed(2)}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(className)}
        {...props}
      />
    );
  }
);

PriceInput.displayName = "PriceInput";

export { PriceInput };
