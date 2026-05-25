import * as React from "react";

export type CalendarProps = {
  selected?: Date;
  onSelect?: (date?: Date) => void;
  min?: string;
  className?: string;
};

function Calendar({ selected, onSelect, min, className }: CalendarProps) {
  const value = selected ? selected.toISOString().slice(0, 10) : "";

  return (
    <input
      type="date"
      value={value}
      min={min}
      className={className}
      onChange={(event) => {
        const next = new Date(event.target.value);
        if (!Number.isNaN(next.getTime())) {
          onSelect?.(next);
        }
      }}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
