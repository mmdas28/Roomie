import { type Frequency, addDays, dayOfWeek } from "@roomie/core";

/** Nominal interval in days for a frequency (used for plain cadences). */
export function intervalDays(freq: Frequency): number {
  switch (freq.type) {
    case "daily":
      return 1;
    case "weekly":
      return 7;
    case "custom":
      return freq.everyNDays;
  }
}

/**
 * The next due date strictly after `fromDate`. Weekly chores pinned to specific
 * weekdays land on the next matching weekday; everything else advances by its
 * interval.
 */
export function nextDueDate(freq: Frequency, fromDate: string): string {
  if (freq.type === "weekly" && freq.daysOfWeek && freq.daysOfWeek.length > 0) {
    for (let i = 1; i <= 7; i++) {
      const candidate = addDays(fromDate, i);
      if (freq.daysOfWeek.includes(dayOfWeek(candidate))) return candidate;
    }
  }
  return addDays(fromDate, intervalDays(freq));
}
