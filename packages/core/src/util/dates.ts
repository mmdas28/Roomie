import type { IsoDate } from "../models/common.js";

/**
 * Date helpers operate on calendar dates ("YYYY-MM-DD") in UTC to keep the
 * rotation/consent engines deterministic and timezone-independent.
 */

export function toIsoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

/** Parse "YYYY-MM-DD" to a UTC Date at midnight. */
export function parseIsoDate(date: IsoDate): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const d = parseIsoDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}

/** 0 = Sunday .. 6 = Saturday. */
export function dayOfWeek(date: IsoDate): number {
  return parseIsoDate(date).getUTCDay();
}

/** Inclusive comparison: is `date` within [start, end]? */
export function isDateInRange(
  date: IsoDate,
  start: IsoDate,
  end: IsoDate,
): boolean {
  return date >= start && date <= end;
}

/** Whole-day difference b - a (can be negative). */
export function daysBetween(a: IsoDate, b: IsoDate): number {
  const ms = parseIsoDate(b).getTime() - parseIsoDate(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function minIsoDate(a: IsoDate, b: IsoDate): IsoDate {
  return a <= b ? a : b;
}
