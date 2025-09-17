import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { PriceInput } from "../ui/PriceInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";

const itemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  url: z.string().optional(),
  imageUrl: z.string().optional(),
  price: z.number().nullable().optional(),
  currency: z.string().optional(),
  priority: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

export type ItemFormData = z.infer<typeof itemSchema>;

interface ItemFormProps {
  initialData: ItemFormData;
}

export const ItemForm: React.FC<ItemFormProps> = ({ initialData }) => {
  const form = useForm({
    defaultValues: initialData,
    validators: {
      onChange: itemSchema,
    },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="imageUrl">
        {({ state }) => (
          <div className="aspect-16/9 bg-muted rounded-lg border border-input overflow-hidden grid grid-cols-1 grid-rows-1">
            {state.value && (
              <img src={state.value} alt="Item" className="w-full h-full object-cover" />
            )}
          </div>
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
              size="small"
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
        <div className="grid grid-cols-3 gap-3 items-center">
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
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">NZD</SelectItem>
                  <SelectItem value="option2">USD</SelectItem>
                </SelectContent>
              </Select>
            )}
          </form.Field>
        </div>
      </div>
    </form>
  );
};
