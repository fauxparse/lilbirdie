import { render, screen } from "@testing-library/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../Select";

describe("Select", () => {
  it("renders with default size", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveClass("h-10"); // medium size default
  });

  it("renders with small size", () => {
    render(
      <Select>
        <SelectTrigger size="small">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("h-8"); // small size
  });

  it("renders with large size", () => {
    render(
      <Select>
        <SelectTrigger size="large">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("h-12"); // large size
  });

  it("renders with proper styling classes", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("flex", "w-full", "items-center", "justify-between");
    expect(trigger).toHaveClass("rounded-md", "border", "border-input", "bg-background");
    expect(trigger).toHaveClass("focus:outline-none", "focus:border-input-focus", "focus:ring-4");
  });

  it("renders with placeholder text", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choose an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByText("Choose an option")).toBeInTheDocument();
  });
});
