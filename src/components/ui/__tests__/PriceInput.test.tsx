import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "../../../test/utils";
import { PriceInput } from "../PriceInput";

describe("PriceInput", () => {
  it("renders with null value as empty string", () => {
    render(<PriceInput value={null} onChange={() => {}} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("");
  });

  it("renders with number value as string with 2 decimal places", () => {
    render(<PriceInput value={12.34} onChange={() => {}} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("12.34");
  });

  it("renders whole numbers with 2 decimal places", () => {
    render(<PriceInput value={100} onChange={() => {}} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("100.00");
  });

  it("calls onChange with null when input is cleared", async () => {
    const onChange = vi.fn();
    const { user } = render(<PriceInput value={12.34} onChange={onChange} />);
    const input = screen.getByRole("textbox");

    await user.clear(input);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("calls onChange with number when valid decimal is entered", () => {
    const onChange = vi.fn();
    render(<PriceInput value={null} onChange={onChange} />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "12.34" } });
    expect(onChange).toHaveBeenCalledWith(12.34);
  });

  it("limits decimal places to 2", () => {
    const onChange = vi.fn();
    render(<PriceInput value={null} onChange={onChange} />);
    const input = screen.getByRole("textbox");

    // Try to enter more than 2 decimal places
    fireEvent.change(input, { target: { value: "12.345" } });
    // Should not call onChange since it's invalid
    expect(onChange).not.toHaveBeenCalled();
  });

  it("prevents multiple decimal points", () => {
    const onChange = vi.fn();
    render(<PriceInput value={null} onChange={onChange} />);
    const input = screen.getByRole("textbox");

    // Try to enter multiple decimal points
    fireEvent.change(input, { target: { value: "12.34.56" } });
    // Should not call onChange since it's invalid
    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes non-numeric characters except decimal point", () => {
    const onChange = vi.fn();
    render(<PriceInput value={null} onChange={onChange} />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "12a.34b" } });
    expect(onChange).toHaveBeenCalledWith(12.34);
  });

  it("strips negative signs from input", () => {
    const onChange = vi.fn();
    render(<PriceInput value={null} onChange={onChange} />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "-12.34" } });
    // Should call onChange with positive value (negative sign stripped)
    expect(onChange).toHaveBeenCalledWith(12.34);
  });

  it("handles whole numbers correctly", () => {
    const onChange = vi.fn();
    render(<PriceInput value={null} onChange={onChange} />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "100" } });
    expect(onChange).toHaveBeenCalledWith(100);
  });

  it("handles decimal numbers without leading zero", () => {
    const onChange = vi.fn();
    render(<PriceInput value={null} onChange={onChange} />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: ".50" } });
    expect(onChange).toHaveBeenCalledWith(0.5);
  });

  it("shows unformatted value when focused", () => {
    render(<PriceInput value={10} onChange={() => {}} />);
    const input = screen.getByRole("textbox");

    // Initially shows formatted value
    expect(input).toHaveValue("10.00");

    // When focused, shows unformatted value
    fireEvent.focus(input);
    expect(input).toHaveValue("10");

    // When blurred, shows formatted value again
    fireEvent.blur(input);
    expect(input).toHaveValue("10.00");
  });

  it("allows typing when focused", () => {
    const onChange = vi.fn();
    render(<PriceInput value={10} onChange={onChange} />);
    const input = screen.getByRole("textbox");

    // Focus the input
    fireEvent.focus(input);
    expect(input).toHaveValue("10");

    // Type a decimal point and numbers
    fireEvent.change(input, { target: { value: "10.5" } });
    expect(onChange).toHaveBeenCalledWith(10.5);
  });

  it("allows typing decimal point when focused", () => {
    const onChange = vi.fn();
    render(<PriceInput value={null} onChange={onChange} />);
    const input = screen.getByRole("textbox");

    // Focus the input
    fireEvent.focus(input);

    // Type just a decimal point - should not call onChange (invalid number)
    fireEvent.change(input, { target: { value: "." } });
    expect(onChange).not.toHaveBeenCalled();

    // Type decimal point with leading zero
    fireEvent.change(input, { target: { value: "0." } });
    expect(onChange).toHaveBeenCalledWith(0);

    // Type decimal point with digits
    fireEvent.change(input, { target: { value: "0.5" } });
    expect(onChange).toHaveBeenCalledWith(0.5);
  });
});
