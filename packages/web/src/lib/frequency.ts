import type { Frequency } from "@roomie/core";

/** The small set of frequency choices the simple UI exposes. */
export type FreqChoice = "daily" | "weekly" | "biweekly";

export function freqToChoice(freq: Frequency): FreqChoice {
  if (freq.type === "daily") return "daily";
  if (freq.type === "weekly") return "weekly";
  return freq.everyNDays >= 14 ? "biweekly" : "weekly";
}

export function choiceToFreq(choice: FreqChoice): Frequency {
  switch (choice) {
    case "daily":
      return { type: "daily" };
    case "weekly":
      return { type: "weekly" };
    case "biweekly":
      return { type: "custom", everyNDays: 14 };
  }
}

export const FREQ_LABELS: Record<FreqChoice, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
};
