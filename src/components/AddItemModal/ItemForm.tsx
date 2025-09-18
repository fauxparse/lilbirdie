import { useForm } from "@tanstack/react-form";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { useCurrencyRates } from "@/hooks/useCurrencyRates";
import { useUserPreferredCurrency } from "@/hooks/useUserPreferredCurrency";
import { CURRENCIES, CURRENCY_CODES, isCurrency } from "@/types/currency";
import { formatPrice } from "../PriceDisplay";
import { Button } from "../ui/Button";
import { ImageUpload } from "../ui/ImageUpload";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { PriceInput } from "../ui/PriceInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { StarInput } from "../ui/StarInput";

const itemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  url: z.string().optional(),
  imageUrl: z.string().optional(),
  price: z.number().nullable().optional(),
  currency: z.enum(["NZD", "USD", "AUD", "EUR", "GBP", "CAD", "JPY"] as const).optional(),
  priority: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

export type ItemFormData = z.infer<typeof itemSchema>;

interface ItemFormProps {
  initialData: ItemFormData;
  busy?: boolean;
  onBack?: () => void;
  onSubmit: (data: ItemFormData) => void;
}

export const ItemForm: React.FC<ItemFormProps> = ({
  initialData,
  busy = false,
  onBack,
  onSubmit,
}) => {
  const { preferredCurrency } = useUserPreferredCurrency();
  const { convertPrice } = useCurrencyRates();

  const form = useForm({
    defaultValues: initialData,
    validators: {
      onChange: itemSchema,
    },
    onSubmit: ({ value }) => onSubmit(value),
  });

  return (
    <form
      className="flex flex-col flex-1"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <fieldset className="flex-1 max-h-[60vh] overflow-y-auto px-5 b-0" disabled={busy}>
        <div className="flex flex-col gap-4">
          <form.Field name="imageUrl">
            {({ state, handleChange }) => (
              <ImageUpload
                value={state.value}
                onChange={(url) => handleChange(url || undefined)}
                aspectRatio="16/9"
                disabled={busy}
              />
            )}
          </form.Field>
          <div className="space-y-2 flex flex-col gap-1">
            <Label htmlFor="name">Name</Label>
            <form.Field name="name">
              {({ state, handleChange }) => (
                <Input
                  id="name"
                  type="text"
                  placeholder="Name"
                  value={state.value || ""}
                  onChange={(e) => handleChange(e.target.value)}
                />
              )}
            </form.Field>
          </div>
          <div className="space-y-2 flex flex-col gap-1">
            <Label htmlFor="url">URL</Label>
            <form.Field name="url">
              {({ state, handleChange }) => (
                <Input
                  id="url"
                  type="text"
                  placeholder="URL"
                  value={state.value || ""}
                  onChange={(e) => handleChange(e.target.value)}
                />
              )}
            </form.Field>
          </div>
          <div className="space-y-2 flex flex-col gap-1">
            <Label htmlFor="price">Price</Label>
            <div className="grid grid-cols-4 gap-3 items-center">
              <form.Field name="price">
                {({ state, handleChange }) => (
                  <PriceInput
                    id="price"
                    value={state.value || null}
                    onChange={(e) => handleChange(e)}
                  />
                )}
              </form.Field>
              <form.Field name="currency">
                {({ state, handleChange }) => (
                  <Select
                    value={state.value || preferredCurrency}
                    onValueChange={(value) => {
                      if (isCurrency(value)) {
                        handleChange(value as ItemFormData["currency"]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option">{state.value}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_CODES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {CURRENCIES[c].name} ({c})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </form.Field>
              <form.Subscribe
                selector={(state) => ({
                  price: state.values.price,
                  currency: state.values.currency,
                })}
              >
                {({ price, currency }) =>
                  price &&
                  currency !== preferredCurrency && (
                    <div className="col-span-2 text-right text-sm text-muted-foreground px-2">
                      ~
                      {formatPrice(
                        convertPrice(price, currency || preferredCurrency, preferredCurrency)
                          ?.convertedAmount || 0,
                        preferredCurrency
                      )}
                    </div>
                  )
                }
              </form.Subscribe>
            </div>
            <div className="space-y-2 flex flex-col gap-1">
              <Label htmlFor="priority">Priority</Label>
              <form.Field name="priority">
                {({ state, handleChange }) => (
                  <StarInput
                    id="priority"
                    value={state.value || 0}
                    onChange={(stars) => handleChange(stars)}
                  />
                )}
              </form.Field>
            </div>
          </div>
        </div>
      </fieldset>
      <div className="flex flex-shrink-0 items-center justify-between gap-3 p-5">
        <div>
          {onBack && (
            <Button type="button" variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go back
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <form.Subscribe
            selector={(state) => ({
              isSubmitting: state.isSubmitting,
              canSubmit: state.canSubmit,
            })}
          >
            <Button type="submit">Save</Button>
          </form.Subscribe>
        </div>
      </div>
    </form>
  );
};
