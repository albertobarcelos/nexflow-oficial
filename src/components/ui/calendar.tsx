import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const currentYear = new Date().getFullYear();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 w-300px]", className)}
      locale={ptBR}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 w-full",
        caption: "flex justify-between pt-1 relative items-center mb-4",
        caption_dropdowns: "flex justify-center items-center w-full gap-2", 
        
        caption_label: "hidden",
        nav: "space-x-2 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-75 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex justify-between w-full px-1.5",
        head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[10px] text-center",
        row: "flex w-full mt-2 justify-between px-1.5",
        cell: "relative flex items-center justify-center h-9 w-9 text-center text-sm p-0 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal hover:bg-accent hover:text-accent-foreground aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected: "bg-orange-500 text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        dropdown: "w-[100px] flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        dropdown_month: "capitalize",
        dropdown_year: "font-medium",
        vhidden: "hidden",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      captionLayout="dropdown-buttons"
      fromYear={1900}
      toYear={currentYear}
      defaultMonth={new Date(currentYear - 25, 0)}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
