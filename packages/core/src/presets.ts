import type { Priority } from "./models/chore.js";

export interface ChorePreset {
  title: string;
  priority: Priority;
}

/**
 * Quick-start preset list (§8B). Each toggle is ON by default at party
 * creation; frequency is inferred from priority via the §8A mapping.
 */
export const CHORE_PRESETS: ChorePreset[] = [
  { title: "Wash the dishes", priority: "high" },
  { title: "Wipe kitchen counters", priority: "high" },
  { title: "Take out the trash", priority: "high" },
  { title: "Clean the bathroom", priority: "medium" },
  { title: "Vacuum / sweep common areas", priority: "medium" },
  { title: "Mop floors", priority: "medium" },
  { title: "Buy shared groceries", priority: "medium" },
  { title: "Clean the fridge", priority: "low" },
  { title: "Wash windows", priority: "low" },
  { title: "Dust surfaces", priority: "low" },
];
