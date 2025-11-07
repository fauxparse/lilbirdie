"use client";

import { OccasionType } from "@prisma/client";
import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { Calendar, Plus, Repeat2, Trash2 } from "lucide-react";
import { useRef } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { OCCASIONS, OccasionDefinition } from "@/lib/occasions";
import { cn } from "@/lib/utils";
import { DatePicker } from "./ui/DatePicker";
import { privacyDescriptions, privacyIcons, privacyLabels } from "./ui/PrivacyBadge";
import { Scrollable } from "./ui/Scrollable";

type Privacy = "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";

const occasionSchema = z
  .object({
    id: z.string(),
    type: z.nativeEnum(OccasionType),
    date: z.string().optional(),
    title: z.string().optional(),
    isRecurring: z.boolean().optional(),
    startYear: z.number().optional(),
  })
  .refine(
    (data) => {
      // Date is required for all except fixed holidays
      if (data.type !== "CHRISTMAS" && data.type !== "VALENTINES_DAY") {
        return !!data.date && data.date.trim() !== "";
      }
      return true;
    },
    {
      message: "Date is required for this occasion type",
      path: ["date"],
    }
  )
  .refine(
    (data) => {
      // Title is required for custom occasions
      if (data.type === "CUSTOM") {
        return !!data.title && data.title.trim() !== "";
      }
      return true;
    },
    {
      message: "Title is required for custom occasions",
      path: ["title"],
    }
  );

const wishlistFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or less"),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
  privacy: z.enum(["PUBLIC", "FRIENDS_ONLY", "PRIVATE"]),
  isDefault: z.boolean(),
  occasions: z.array(occasionSchema).optional(),
});

export type WishlistFormData = z.infer<typeof wishlistFormSchema>;
export type OccasionData = z.infer<typeof occasionSchema>;

export interface WishlistFormProps {
  mode: "create" | "edit";
  initialData?: Partial<WishlistFormData>;
  onSubmit: (data: WishlistFormData) => void;
  isSubmitting?: boolean;
  error?: string | null;
  submitLabel?: string;
  onCancel: () => void;
  user?: { name: string; id: string; email: string };
}

export function WishlistForm({
  mode,
  initialData = {},
  onSubmit,
  isSubmitting = false,
  error = null,
  submitLabel,
  onCancel,
  user,
}: WishlistFormProps) {
  // Prepare default values with proper typing
  const defaultFormValues: z.input<typeof wishlistFormSchema> = {
    title: initialData.title || (user?.name ? `${user.name}'s wishlist` : "My wishlist"),
    description: initialData.description,
    privacy: (initialData.privacy || "FRIENDS_ONLY") as "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE",
    isDefault: initialData.isDefault || false,
    occasions: initialData.occasions,
  };

  // Initialize Tanstack Form
  const form = useForm({
    defaultValues: defaultFormValues,
    validators: {
      onChange: wishlistFormSchema,
    },
    onSubmit: async ({ value }) => {
      // Transform data before submitting
      onSubmit({
        title: value.title.trim(),
        description: value.description?.trim() || undefined,
        privacy: value.privacy,
        isDefault: value.isDefault,
        occasions: value.occasions && value.occasions.length > 0 ? value.occasions : undefined,
      });
    },
  });

  const addOccasion = () => {
    const currentOccasions = form.getFieldValue("occasions") || [];
    form.setFieldValue("occasions", [
      ...currentOccasions,
      {
        id: crypto.randomUUID(),
        type: "BIRTHDAY" as OccasionType,
        date: new Date().toISOString(),
        title: "Birthday",
        isRecurring: true,
      },
    ]);
  };

  const removeOccasion = (id: string) => {
    const currentOccasions = form.getFieldValue("occasions") || [];
    form.setFieldValue(
      "occasions",
      currentOccasions.filter((occasion) => occasion.id !== id)
    );
  };

  const updateOccasion = (id: string, data: Partial<OccasionData>) => {
    const currentOccasions = form.getFieldValue("occasions") || [];
    const updated = currentOccasions.map((occasion) =>
      occasion.id === id ? { ...occasion, ...data } : occasion
    );

    form.setFieldValue("occasions", updated);
  };

  const defaultSubmitLabel = mode === "create" ? "Create Wishlist" : "Update Wishlist";
  const submittingLabel = mode === "create" ? "Creating..." : "Updating...";

  return (
    <form
      className="grid grid-rows-[1fr_auto] flex-1 min-h-0"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <Scrollable className="">
        <div className="flex flex-col gap-6 px-5 py-5">
          {error && <div className="text-sm text-red-600">{error}</div>}

          <form.Field name="title">
            {({ state, handleChange, handleBlur }) => (
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder={user?.name ? `${user.name}’s wishlist` : "My wishlist"}
                  value={state.value}
                  onChange={(e) => handleChange(e.target.value)}
                  onBlur={handleBlur}
                  maxLength={100}
                />
                {state.meta.isTouched && state.meta.errors.length > 0 && (
                  <p className="text-sm text-red-600">
                    {typeof state.meta.errors[0] === "string"
                      ? state.meta.errors[0]
                      : state.meta.errors[0]?.message || "Invalid value"}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="description">
            {({ state, handleChange, handleBlur }) => (
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  className="resize-none"
                  placeholder="What's this wishlist for? (optional)"
                  value={state.value || ""}
                  onChange={(e) => handleChange(e.target.value)}
                  onBlur={handleBlur}
                  maxLength={500}
                  rows={3}
                />
                {state.meta.isTouched && state.meta.errors.length > 0 && (
                  <p className="text-sm text-red-600">
                    {typeof state.meta.errors[0] === "string"
                      ? state.meta.errors[0]
                      : state.meta.errors[0]?.message || "Invalid value"}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="privacy">
            {({ state, handleChange }) => (
              <RadioGroup
                className="grid grid-cols-3 gap-3 items-stretch"
                value={state.value}
                onValueChange={(value: string) => handleChange(value as Privacy)}
              >
                {(Object.entries(privacyLabels) as [Privacy, string][]).map(([privacy, label]) => {
                  const Icon = privacyIcons[privacy];
                  return (
                    <Label
                      key={privacy}
                      className={cn(
                        "flex flex-col gap-2 items-center text-center rounded-md p-3 leading-tight cursor-pointer relative border-1 border-transparent text-muted-foreground",
                        "hover:text-foreground",
                        "has-checked:bg-background-secondary has-checked:border-border has-checked:text-foreground",
                        "focus-within:ring-4 focus-within:ring-ring focus-within:ring-offset-0 focus-within:border-input-focus"
                      )}
                    >
                      <Icon className="h-6 w-6" />
                      <RadioGroupItem value={privacy} className="absolute inset-0 opacity-0" />
                      <div>
                        <b>{label}</b>
                        <div className="text-balance text-muted-foreground">
                          {privacyDescriptions[privacy as Privacy]}
                        </div>
                      </div>
                    </Label>
                  );
                })}
              </RadioGroup>
            )}
          </form.Field>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-lg font-medium">
                <Calendar className="h-6 w-6" />
                Occasions
              </Label>
              <Button type="button" variant="outline" size="small" onClick={addOccasion}>
                <Plus className="h-4 w-4 mr-1" />
                Add Occasion
              </Button>
            </div>

            <form.Subscribe selector={(state) => state.values.occasions}>
              {(occasions) => (
                <div className="@container">
                  {occasions && occasions.length > 0 && (
                    <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-4 @md:grid-cols-[1fr_1fr_1fr_auto]">
                      {occasions.map((occasion, index) => (
                        <OccasionRow
                          key={index}
                          occasion={occasion}
                          onRemove={() => removeOccasion(occasion.id)}
                          onUpdate={(data) => updateOccasion(occasion.id, data)}
                        />
                      ))}
                    </div>
                  )}

                  {(!occasions || occasions.length === 0) && (
                    <p className="text-sm text-gray-500 text-center text-balance py-4">
                      No occasions added yet. Add occasions like birthdays, holidays, or
                      anniversaries to associate with this wishlist.
                    </p>
                  )}
                </div>
              )}
            </form.Subscribe>
          </div>
        </div>
      </Scrollable>
      <div className="flex justify-end gap-3 flex-shrink-0 bg-background p-5">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ canSubmit }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? submittingLabel : submitLabel || defaultSubmitLabel}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

type OccasionRowProps = {
  occasion: OccasionData;
  onUpdate: (data: Partial<OccasionData>) => void;
  onRemove: () => void;
};

const OccasionRow: React.FC<OccasionRowProps> = ({ occasion, onUpdate, onRemove }) => {
  const definition = OCCASIONS[occasion.type];

  const titleInputRef = useRef<HTMLInputElement>(null);

  const handleTypeChange = (value: OccasionType) => {
    const newTitle = value === "CUSTOM" ? "" : OCCASIONS[value].label;
    onUpdate({ type: value, title: newTitle });
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 50);
  };

  return (
    <div key={occasion.id} className="grid grid-cols-subgrid col-span-full items-center gap-y-2">
      <div className="flex items-center gap-2 col-1 @md:col-span-2">
        <Select
          value={occasion.type}
          onValueChange={(value) => handleTypeChange(value as OccasionType)}
        >
          <SelectTrigger className={cn(occasion.type === "CUSTOM" ? "col-span-1" : "col-span-2")}>
            <div className="flex items-center gap-2">
              <SelectValue placeholder="Occasion" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(OCCASIONS) as [OccasionType, OccasionDefinition][]).map(
              ([key, { label, icon: Icon }]) => (
                <SelectItem key={key} value={key} indicatorSide="right">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </div>
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        {occasion.type === "CUSTOM" && (
          <Input
            ref={titleInputRef}
            type="text"
            placeholder="e.g., Housewarming"
            value={occasion.title || ""}
            onChange={(e) => onUpdate({ title: e.target.value })}
            maxLength={100}
          />
        )}
      </div>

      <div className="col-1 @md:col-3">
        {definition.date ? (
          <p className="text-sm text-muted-foreground border border-border border-dashed rounded-md py-2 px-4 flex items-center gap-2 self-stretch">
            <Calendar className="h-4 w-4" />
            <span>{format(definition.date, "PPP").replace(/,?\s*\d{4}$/, "")}</span>
          </p>
        ) : (
          <DatePicker
            date={occasion.date ? new Date(occasion.date) : undefined}
            format="d MMM, yyyy"
            onDateChange={(date) => {
              if (date) {
                // Format as YYYY-MM-DD for storage
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                onUpdate({ date: `${year}-${month}-${day}` });
              } else {
                onUpdate({ date: undefined });
              }
            }}
            placeholder="Select a date"
          />
        )}
      </div>

      <div className="flex flex-col items-center gap-2 -col-1 row-[1/span_2] @md:flex-row @md:row-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-pressed={occasion.isRecurring ?? undefined}
          className="opacity-50 aria-pressed:opacity-100 aria-pressed:text-foreground aria-pressed:bg-background-secondary"
          onClick={() => onUpdate({ isRecurring: !occasion.isRecurring })}
        >
          <Repeat2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="hover:text-destructive hover:bg-destructive-soft"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
