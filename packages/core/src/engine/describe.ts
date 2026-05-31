import type { Frequency } from "../models/chore.js";
import type { ProposalPayload } from "../models/proposal.js";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Human label for a frequency, e.g. "Daily", "Weekly (Mon, Thu)". */
export function describeFrequency(freq: Frequency): string {
  switch (freq.type) {
    case "daily":
      return "Daily";
    case "weekly":
      return freq.daysOfWeek && freq.daysOfWeek.length > 0
        ? `Weekly (${freq.daysOfWeek.map((d) => WEEKDAYS[d]).join(", ")})`
        : "Weekly";
    case "custom":
      return freq.everyNDays === 14
        ? "Every 2 weeks"
        : `Every ${freq.everyNDays} days`;
  }
}

export interface DescribeContext {
  proposerName: string;
  memberName: (id: string) => string;
  choreTitle?: string;
}

/** Build the one-line summary shown to approvers on the Proposals screen. */
export function describeProposal(
  payload: ProposalPayload,
  ctx: DescribeContext,
): string {
  const chore = ctx.choreTitle ?? "a chore";
  switch (payload.type) {
    case "chore_edit": {
      const parts: string[] = [];
      if (payload.changes.title) parts.push(`rename it to "${payload.changes.title}"`);
      if (payload.changes.priority) parts.push(`set priority to ${payload.changes.priority}`);
      if (payload.changes.frequency)
        parts.push(`change frequency to ${describeFrequency(payload.changes.frequency).toLowerCase()}`);
      if (payload.changes.description !== undefined) parts.push("update the description");
      const what = parts.length > 0 ? parts.join(", ") : "edit it";
      return `${ctx.proposerName} wants to ${what} on "${chore}".`;
    }
    case "chore_rotation_change":
      return `${ctx.proposerName} wants to change who's in the "${chore}" rotation.`;
    case "chore_delete":
      return `${ctx.proposerName} wants to delete "${chore}".`;
    case "member_remove":
      return `${ctx.proposerName} wants to remove ${ctx.memberName(
        payload.targetMemberId,
      )} from the household.`;
  }
}
