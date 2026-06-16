import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import Colors from "@/constants/Colors";

interface DateTimePickerProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onSelectDate: (date: Date) => void;
  onSelectTime: (time: string) => void;
  dateOptions: Date[];
  availableSlots: string[];
  themeColor?: string;
  softThemeColor?: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DateTimePicker({
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  availableSlots,
  themeColor = Colors.light.primary,
  softThemeColor = Colors.light.primarySoft,
}: DateTimePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calendar View Month/Year state
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    if (selectedDate) {
      return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  // Get month name
  const monthName = currentMonthDate.toLocaleString("default", { month: "long" });

  // Navigation handlers
  const handlePrevMonth = () => {
    // Prevent going before the current month
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    if (currentMonthDate <= currentMonthStart) return;

    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const isPrevDisabled = () => {
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return currentMonthDate <= currentMonthStart;
  };

  // Generate calendar days
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayIndex = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIdx = getFirstDayIndex(year, month);

  const cells = [];
  // Front padding slots
  for (let i = 0; i < firstDayIdx; i++) {
    cells.push({ id: `empty-${i}`, day: null, isPast: true, date: null });
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(year, month, d);
    const isPast = cellDate < today;
    cells.push({
      id: `day-${d}`,
      day: d,
      isPast,
      date: cellDate,
    });
  }

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>SCHEDULE</Text>

      {/* Month Picker Header */}
      <View style={styles.monthHeader}>
        <Pressable
          onPress={handlePrevMonth}
          disabled={isPrevDisabled()}
          style={({ pressed }) => [
            styles.arrowButton,
            isPrevDisabled() && styles.disabledArrow,
            pressed && !isPrevDisabled() && styles.arrowPressed,
          ]}
        >
          <Text style={[styles.arrowText, { color: isPrevDisabled() ? Colors.light.textTertiary : themeColor }]}>←</Text>
        </Pressable>
        
        <Text style={styles.monthLabel}>
          {monthName} {year}
        </Text>

        <Pressable
          onPress={handleNextMonth}
          style={({ pressed }) => [
            styles.arrowButton,
            pressed && styles.arrowPressed,
          ]}
        >
          <Text style={[styles.arrowText, { color: themeColor }]}>→</Text>
        </Pressable>
      </View>

      {/* Weekday Titles */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekdayText}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {cells.map((cell, idx) => {
          if (cell.day === null) {
            return <View key={cell.id} style={styles.gridCell} />;
          }

          const isSelected =
            selectedDate &&
            selectedDate.getDate() === cell.day &&
            selectedDate.getMonth() === month &&
            selectedDate.getFullYear() === year;

          const isCellToday =
            today.getDate() === cell.day &&
            today.getMonth() === month &&
            today.getFullYear() === year;

          return (
            <Pressable
              key={cell.id}
              disabled={cell.isPast}
              onPress={() => cell.date && onSelectDate(cell.date)}
              style={({ pressed }) => [
                styles.gridCell,
                isCellToday && styles.todayCell,
                isSelected && { backgroundColor: themeColor },
                cell.isPast && styles.pastCell,
                pressed && !cell.isPast && { opacity: 0.7 },
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  isCellToday && { color: themeColor, fontFamily: Colors.fonts.bold },
                  isSelected && { color: "#ffffff", fontFamily: Colors.fonts.bold },
                  cell.isPast && styles.pastText,
                ]}
              >
                {cell.day}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Time Slots */}
      {selectedDate && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionSubtitle}>Available Slots</Text>
          
          {availableSlots.length === 0 ? (
            <View style={styles.noSlotsCard}>
              <Text style={styles.noSlotsText}>No slots available. Please select another date.</Text>
            </View>
          ) : (
            <View style={styles.slotsGrid}>
              {availableSlots.map((slot) => {
                const isSelected = selectedTime === slot;
                return (
                  <Pressable
                    key={slot}
                    onPress={() => onSelectTime(slot)}
                    style={[
                      styles.slotBtn,
                      isSelected
                        ? { borderColor: themeColor, backgroundColor: softThemeColor }
                        : styles.slotBtnInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.slotBtnText,
                        isSelected ? { color: themeColor, fontFamily: Colors.fonts.bold } : null,
                      ]}
                    >
                      {slot}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
    fontFamily: Colors.fonts.bold,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 10,
    fontFamily: Colors.fonts.bold,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowPressed: {
    backgroundColor: "#F3EEF1",
  },
  disabledArrow: {
    borderColor: Colors.light.borderLight,
    opacity: 0.4,
  },
  arrowText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: Colors.fonts.bold,
  },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 6,
  },
  weekdayText: {
    width: 40,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.textTertiary,
    fontFamily: Colors.fonts.semiBold,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  gridCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    borderRadius: 999,
  },
  todayCell: {
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  pastCell: {
    opacity: 0.25,
  },
  dayText: {
    fontSize: 13,
    color: Colors.light.text,
    fontFamily: Colors.fonts.medium,
  },
  pastText: {
    color: Colors.light.textTertiary,
    fontFamily: Colors.fonts.regular,
  },
  noSlotsCard: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "rgba(180, 83, 9, 0.2)",
    borderRadius: 12,
    padding: 12,
  },
  noSlotsText: {
    fontSize: 12,
    color: "#b45309",
    fontWeight: "500",
    textAlign: "center",
    fontFamily: Colors.fonts.medium,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slotBtn: {
    flex: 1,
    minWidth: 120,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  slotBtnInactive: {
    borderColor: Colors.light.border,
    backgroundColor: "#ffffff",
  },
  slotBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    fontFamily: Colors.fonts.bold,
  },
});
