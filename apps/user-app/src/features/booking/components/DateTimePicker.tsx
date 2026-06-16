import { useMemo } from "react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { CalendarDays, Clock, Calendar } from "lucide-react";

export interface TimeSlotInfo {
  label: string;
  available: boolean;
}

interface DateTimePickerProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  timeSlots?: Array<string | TimeSlotInfo>;
  onSelectDate: (date: Date) => void;
  onSelectTime: (time: string) => void;
  onNext: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  showContinueButton?: boolean;
  continueLabel?: string;
  minDate?: Date;
  allowFallback?: boolean;
  slotsLoading?: boolean;
  noPartnersNearby?: boolean;
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
  slotsLoading = false,
  noPartnersNearby = false,
}: DateTimePickerProps) => {
  const today = minDate ?? new Date();
  const baseDate = new Date(today);
  baseDate.setHours(0, 0, 0, 0);

  const dates = useMemo(() => {
    const list: Date[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      list.push(d);
    }
    return list;
  }, [baseDate]);

  const slots = useMemo<TimeSlotInfo[]>(() => {
    if (!timeSlots || timeSlots.length === 0) {
      return [];
    }
    return timeSlots.map((slot) => {
      if (typeof slot === "string") {
        return { label: slot, available: true };
      }
      return slot;
    });
  }, [timeSlots]);

  return (
    <div className="px-4 py-5 animate-fade-in-up lg:px-0">
      <div className="text-[12px] text-[#5C3A58] font-bold uppercase tracking-[0.8px] mb-3">Schedule</div>

      {/* Custom 30-Day Scrollable Calendar Card */}
      <div className="bg-white rounded-[18px] border border-[#EDE4EB] p-4 mb-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-[18px] h-[18px] text-[#A7009D]" />
            <span className="text-[13px] font-bold text-[#1a0a18]">Select Date</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#5C3A58]">
            <Calendar className="w-3.5 h-3.5 text-[#8A6888]" />
            {selectedDate
              ? selectedDate.toLocaleDateString(undefined, {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                })
              : "Not selected"}
          </div>
        </div>

        {/* 30-Day Horizontal Scroll List */}
        <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
          {dates.map((date) => {
            const isSelected =
              selectedDate &&
              date.getFullYear() === selectedDate.getFullYear() &&
              date.getMonth() === selectedDate.getMonth() &&
              date.getDate() === selectedDate.getDate();

            const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
            const dayNum = date.getDate();
            const month = date.toLocaleDateString("en-US", { month: "short" });

            return (
              <button
                key={date.toISOString()}
                onClick={() => onSelectDate(date)}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[70px] h-[90px] rounded-2xl border transition-all cursor-pointer select-none",
                  isSelected
                    ? "border-[#A7009D] bg-[#FBF0FB] text-[#A7009D] shadow-sm font-bold scale-[1.02]"
                    : "border-[#EDE4EB] bg-white text-[#5C3A58] hover:border-[#A7009D]/40 hover:bg-[#FDF9FD]"
                )}
              >
                <span className="text-[10px] uppercase tracking-wider opacity-85">{weekday}</span>
                <span className="text-lg font-bold my-1">{dayNum}</span>
                <span className="text-[10px] font-semibold opacity-90">{month}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="mb-5 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-[18px] h-[18px] text-[#A7009D]" />
            <span className="text-[13px] font-bold text-[#1a0a18]">Available Slots</span>
          </div>
          <div className="rounded-[18px] border border-[#EDE4EB] bg-white p-4">
            {slotsLoading ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3 text-sm text-[#5C3A58]">
                <div className="h-6 w-6 rounded-full border-2 border-[#EDE4EB] border-t-[#A7009D] animate-spin" />
                <span className="text-[13px] font-semibold animate-pulse">Getting you a time slot, please wait...</span>
              </div>
            ) : noPartnersNearby ? (
              <div className="text-[13px] font-bold text-[#b91c1c] bg-[#FEF2F2] p-4 rounded-xl border border-[#fca5a5] flex items-center gap-2.5 animate-fade-in">
                <span className="text-lg">📍</span>
                <span>Sorry, no partners available in your area.</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {slots.map(({ label, available }) => {
                    const isSelected = selectedTime === label;
                    if (!available) {
                      return (
                        <button
                          key={label}
                          disabled
                          className="py-3 px-2 rounded-xl text-[12px] font-bold border border-[#EDE4EB] bg-[#F3EEF1] text-[#8A6888] opacity-50 cursor-not-allowed flex items-center justify-center gap-1 select-none"
                        >
                          <span>{label}</span>
                          <span>🔒</span>
                        </button>
                      );
                    }
                    return (
                      <button
                        key={label}
                        onClick={() => onSelectTime(label)}
                        className="py-3 px-2 rounded-xl text-[12px] font-bold transition-all cursor-pointer"
                        style={{
                          border: `${isSelected ? 2 : 1}px solid ${isSelected ? "#A7009D" : "#EDE4EB"}`,
                          background: isSelected ? "rgba(167,0,157,0.08)" : "#FFFFFF",
                          color: isSelected ? "#A7009D" : "#5C3A58",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {slots.length === 0 ? (
                  <div className="text-[12px] text-[#b45309] bg-[#FEF3C7] p-3 rounded-xl border border-[#b45309]/20">
                    No slots available. Please select another date.
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      )}

      {(showBackButton || showContinueButton) && (
        <div className="flex gap-3 mt-6">
          {showBackButton && onBack && (
            <Button variant="outline" onClick={onBack} className="flex-1 rounded-2xl h-12 border-[#EDE4EB]">
              Back
            </Button>
          )}
          {showContinueButton && (
            <Button
              onClick={onNext}
              disabled={!selectedDate || !selectedTime || slotsLoading || noPartnersNearby}
              className="flex-1 rounded-2xl h-[48px] bg-[#A7009D] hover:bg-[#6B0068] text-white text-[14px] font-bold shadow-elevated"
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
