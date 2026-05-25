import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { CalendarDays, Clock, Calendar } from "lucide-react";

interface DateTimePickerProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  timeSlots?: string[];
  onSelectDate: (date: Date) => void;
  onSelectTime: (time: string) => void;
  onNext: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  showContinueButton?: boolean;
  continueLabel?: string;
  minDate?: Date;
  allowFallback?: boolean;
}

const DateTimePicker = ({
  selectedDate,
  selectedTime,
  timeSlots,
  onSelectDate,
  onSelectTime,
  onNext,
  onBack,
  showBackButton = true,
  showContinueButton = true,
  continueLabel = "Continue",
  minDate,
  allowFallback = true,
}: DateTimePickerProps) => {
  const today = minDate ?? new Date();
  const baseDate = new Date(today);
  baseDate.setHours(0, 0, 0, 0);
  const dateValue = selectedDate
    ? selectedDate.toISOString().slice(0, 10)
    : "";

  const slots =
    allowFallback && (!timeSlots || timeSlots.length === 0)
      ? []
      : timeSlots ?? [];

  return (
    <div className="px-4 py-5 animate-fade-in-up">
      <div className="text-[12px] text-[#3E6255] font-bold uppercase tracking-[0.8px] mb-3">Schedule</div>

      <div className="bg-white rounded-[18px] border border-[#DDE8E3] p-4 mb-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-[18px] h-[18px] text-[#27AE78]" />
            <span className="text-[13px] font-bold text-[#081C13]">Select Date</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#3E6255]">
            <Calendar className="w-3.5 h-3.5 text-[#6E8F83]" />
            {selectedDate
              ? selectedDate.toLocaleDateString(undefined, {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                })
              : "Not selected"}
          </div>
        </div>
        <input
          type="date"
          value={dateValue}
          min={baseDate.toISOString().slice(0, 10)}
          onChange={(event) => {
            const value = event.target.value;
            if (!value) return;
            const nextDate = new Date(value);
            if (!Number.isNaN(nextDate.getTime())) {
              onSelectDate(nextDate);
            }
          }}
          className="mt-3 w-full rounded-xl border border-[#DDE8E3] bg-[#F0F5F2]/50 px-3.5 py-3 text-[14px] outline-none text-[#081C13] transition-colors focus:border-[#27AE78] focus:bg-white"
        />
      </div>

      {selectedDate && (
        <div className="mb-5 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-[18px] h-[18px] text-[#27AE78]" />
            <span className="text-[13px] font-bold text-[#081C13]">Available Slots</span>
          </div>
          <div className="rounded-[18px] border border-[#DDE8E3] bg-white p-4">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {slots.map((slot) => {
                const isSelected = selectedTime === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => onSelectTime(slot)}
                    className="py-3 px-2 rounded-xl text-[12px] font-bold transition-all"
                    style={{
                      border: `${isSelected ? 2 : 1}px solid ${isSelected ? "#27AE78" : "#DDE8E3"}`,
                      background: isSelected ? "rgba(39,174,120,0.08)" : "#FFFFFF",
                      color: isSelected ? "#0B3B2A" : "#3E6255"
                    }}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
            {slots.length === 0 ? (
              <div className="mt-3 text-[12px] text-[#C8731A] bg-[#FEF1E4] p-3 rounded-xl border border-[#C8731A]/20">
                No slots available. Please select another date.
              </div>
            ) : null}
          </div>
        </div>
      )}

      {(showBackButton || showContinueButton) && (
        <div className="flex gap-3 mt-6">
          {showBackButton && onBack && (
            <Button variant="outline" onClick={onBack} className="flex-1 rounded-2xl h-12 border-[#DDE8E3]">
              Back
            </Button>
          )}
          {showContinueButton && (
            <Button
              onClick={onNext}
              disabled={!selectedDate || !selectedTime}
              className="flex-1 rounded-2xl h-[48px] bg-[#0B3B2A] hover:bg-[#155E41] text-white text-[14px] font-bold shadow-elevated"
            >
              {continueLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
