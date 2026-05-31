import { daysBetween, parseIsoDate } from "@roomie/core";
import { today } from "./time.js";

/** Two-letter initials for an avatar. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Friendly relative due label: "Today", "Tomorrow", "in 3 days", "2 days ago". */
export function dueLabel(dueDate: string): string {
  const diff = daysBetween(today(), dueDate);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return `in ${diff} days`;
}

/** "Mon, Jun 1" style label for a calendar date. */
export function shortDate(date: string): string {
  return parseIsoDate(date).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Time-until label for proposal expiry. */
export function expiresInLabel(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const hours = Math.round(ms / 3_600_000);
  if (hours < 1) return "expires soon";
  if (hours < 24) return `${hours}h left`;
  return `${Math.round(hours / 24)}d left`;
}
