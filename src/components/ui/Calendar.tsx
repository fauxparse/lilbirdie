"use client";

import { format, getMonth, getYear, setMonth, setYear } from "date-fns";
import { Calendar1, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import {
  CalendarWeek,
  DayButton,
  DayPicker,
  getDefaultClassNames,
  useDayPicker,
} from "react-day-picker";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";

const WeekNumber = ({
  children,
  ...props
}: {
  week: CalendarWeek;
} & React.ThHTMLAttributes<HTMLTableCellElement>) => {
  return (
    <td {...props}>
      <div className="flex size-[--cell-size] items-center justify-center text-center">
        {children}
      </div>
    </td>
  );
};

const CalendarRoot = ({
  className,
  rootRef,
  ...props
}: {
  className?: string;
  rootRef?: React.Ref<HTMLDivElement>;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
};

const CalendarChevron = ({
  className,
  orientation,
  ...props
}: {
  className?: string;
  orientation?: "left" | "right" | "up" | "down";
} & React.SVGAttributes<SVGElement>) => {
  if (orientation === "left") {
    return <ChevronLeftIcon className={cn("size-4", className)} {...props} />;
  }

  if (orientation === "right") {
    return <ChevronRightIcon className={cn("size-4", className)} {...props} />;
  }

  return <ChevronDownIcon className={cn("size-4", className)} {...props} />;
};

type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
};

const Calendar: React.FC<CalendarProps> = ({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}) => {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar p-3 [--cell-size:2rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn(defaultClassNames.root, "w-full min-w-fit"),
        nav: "row-1 col-2 flex items-center justify-end",
        months: "grid grid-cols-[1fr_auto] gap-y-2",
        month: "contents",
        table: "col-[1/-1]",
        month_grid: cn(
          defaultClassNames.month_grid,
          "col-[1/-1] grid grid-cols-[repeat(7,minmax(2em,1fr))] *:col-[1/-1] *:grid-cols-subgrid *:grid",
          "border-t border-border pt-3"
        ),
        weekdays: cn(defaultClassNames.weekdays, "col-[1/-1] grid grid-cols-subgrid mb-2"),
        weekday: "text-sm text-muted-foreground font-normal",
        weeks: "col-[1/-1] grid grid-cols-subgrid",
        week: "col-[1/-1] grid grid-cols-subgrid",
        day: "group/day relative aspect-square h-full w-full select-none p-0 text-center text-foreground",
        day_button: "rounded-full squircle text-inherit hover:bg-background-hover border-0",
        today: "text-primary",
        outside: "not-data-selected:opacity-50",
        button_previous: "size-8",
        button_next: "size-8",
        ...classNames,
      }}
      components={{
        Root: CalendarRoot,
        Chevron: CalendarChevron,
        DayButton: CalendarDayButton,
        CaptionLabel: MonthCaption,
        WeekNumber,
        NextMonthButton: CalendarNextButton,
        PreviousMonthButton: CalendarPreviousButton,
        ...components,
      }}
      {...props}
    />
  );
};

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 flex aspect-square h-auto w-full min-w-[--cell-size] flex-col gap-1 font-normal leading-none data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}

const allMonths = Array.from({ length: 12 }, (_, index) => setMonth(new Date(), index));
const allYears = Array.from({ length: 201 }, (_, index) => new Date().getFullYear() - 100 + index);

function MonthCaption({ className, children, ...props }: React.ComponentProps<"span">) {
  const { months, goToMonth } = useDayPicker();
  console.log(months);

  const selectMonth = (month: number) => {
    goToMonth(setMonth(months[0].date, month));
  };

  const selectYear = (year: number) => {
    goToMonth(setYear(months[0].date, year));
  };

  return (
    <span className={cn("flex items-center gap-2", className)} {...props}>
      <Select
        value={getMonth(months[0].date).toString()}
        onValueChange={(value) => selectMonth(parseInt(value, 10))}
      >
        <SelectTrigger size="small" className="w-[8em]">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent className="min-w-(--radix-popover-trigger-width)">
          {allMonths.map((date) => (
            <SelectItem key={date.getMonth()} value={getMonth(date).toString()}>
              {format(date, "MMMM")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={getYear(months[0].date).toString()}
        onValueChange={(value) => selectYear(parseInt(value, 10))}
      >
        <SelectTrigger size="small" className="w-[5.5em]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent className="min-w-(--radix-popover-trigger-width)">
          {allYears.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="ghost" size="icon" onClick={() => goToMonth(new Date())}>
        <Calendar1 className="w-6 h-6" />
      </Button>
    </span>
  );
}

function CalendarNextButton({ children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="ghost" size="icon" {...props}>
      <ChevronRightIcon className="w-6 h-6" />
    </Button>
  );
}

function CalendarPreviousButton({ children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="ghost" size="icon" {...props}>
      <ChevronLeftIcon className="w-6 h-6" />
    </Button>
  );
}

export { Calendar, CalendarDayButton };
