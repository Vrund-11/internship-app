const SLOT_RANGES: Array<[number, number]> = [
  [10, 12],
  [12, 14],
  [14, 16],
  [16, 18],
];

export type SlotWindow = {
  slotStart: Date;
  slotEnd: Date;
};

/**
 * Generates fixed 2-hour slot windows for a given date.
 * Returns an array of { slotStart, slotEnd } objects.
 */
export function generateSlots(date: Date): SlotWindow[] {
  const slots: SlotWindow[] = [];

  for (const [startHour, endHour] of SLOT_RANGES) {
    const slotStart = new Date(date);
    slotStart.setHours(startHour, 0, 0, 0);

    const slotEnd = new Date(date);
    slotEnd.setHours(endHour, 0, 0, 0);

    slots.push({ slotStart, slotEnd });
  }

  return slots;
}
