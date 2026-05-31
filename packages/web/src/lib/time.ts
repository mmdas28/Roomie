import { toIsoDate } from "@roomie/core";

/** Current instant as an ISO datetime. Centralized so it's easy to mock. */
export function now(): string {
  return new Date().toISOString();
}

/** Today's calendar date as "YYYY-MM-DD" (local). */
export function today(): string {
  return toIsoDate(new Date());
}
