import * as React from "react";

export type CalendarProps = {
  selected?: Date;
  onSelect?: (date?: Date) => void;
  min?: string;
  className?: string;
};

function Calendar({ selected, onSelect, min, className }: CalendarProps) {
  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const value = selected ? getLocalDateString(selected) : "";

  return (
    <input
      type="date"
      value={value}
      min={min}
      className={className}
      onChange={(event) => {
        const parts = event.target.value.split("-");
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const next = new Date(year, month, day);
          if (!Number.isNaN(next.getTime())) {
            onSelect?.(next);
          }
        }
      }}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
