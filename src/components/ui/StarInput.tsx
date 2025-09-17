"use client";
import { Star } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils";

interface StarInputProps {
  className?: string;
  id?: string;
  max?: number;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export const StarInput: React.FC<StarInputProps> = ({
  className,
  id: idProp,
  max = 3,
  value,
  disabled,
  onChange,
}) => {
  const ownId = useId();
  const id = idProp ?? ownId;

  return (
    <div className={cn("flex items-center", className)}>
      {Array.from({ length: max }).map((_, index) => (
        <label
          key={index}
          htmlFor={`${id}-${index}`}
          className="grid items-center justify-items-center"
        >
          <Star
            className={cn(
              "h-6 w-6 stroke-none col-start-1 row-start-1 pointer-events-none",
              value > index ? "fill-star" : "fill-star/25"
            )}
          />
          <input
            type="radio"
            className="col-start-1 row-start-1 align-self-stretch justify-self-stretch opacity-0 cursor-pointer disabled:cursor-default"
            id={`${id}-${index}`}
            name={id}
            value={index + 1}
            checked={value === index + 1}
            onChange={(e) => {
              console.log(index + 1, e.currentTarget.checked);
              if (e.currentTarget.checked) onChange(index + 1);
            }}
            disabled={disabled || undefined}
          />
        </label>
      ))}
    </div>
  );
};
