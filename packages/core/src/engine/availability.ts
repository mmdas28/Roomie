import type { IsoDate } from "../models/common.js";
import type { ScheduleBlock } from "../models/schedule.js";
import { dayOfWeek, isDateInRange } from "../util/dates.js";

/** Does a single block cover `date` (respecting optional weekly recurrence)? */
export function blockCoversDate(block: ScheduleBlock, date: IsoDate): boolean {
  if (!isDateInRange(date, block.startDate, block.endDate)) return false;
  if (!block.recurrence) return true;
  return block.recurrence.daysOfWeek.includes(dayOfWeek(date));
}

/** Is the member marked away/unavailable on `date` by any of their blocks? */
export function isMemberUnavailable(
  memberId: string,
  date: IsoDate,
  blocks: readonly ScheduleBlock[],
): boolean {
  return blocks.some(
    (b) => b.memberId === memberId && blockCoversDate(b, date),
  );
}
