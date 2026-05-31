import type {
  Chore,
  Member,
  Party,
  ScheduleBlock,
} from "../src/index.js";

let seq = 0;
const nextId = (p: string) => `${p}_${++seq}`;

export function member(overrides: Partial<Member> = {}): Member {
  return {
    id: overrides.id ?? nextId("m"),
    partyId: overrides.partyId ?? "party",
    displayName: overrides.displayName ?? "Member",
    avatarColor: overrides.avatarColor ?? "#5C8B5A",
    role: overrides.role ?? "member",
    status: overrides.status ?? "active",
    joinedAt: overrides.joinedAt ?? "2026-01-01T00:00:00.000Z",
  };
}

export function party(overrides: Partial<Party> = {}): Party {
  return {
    id: overrides.id ?? "party",
    name: overrides.name ?? "The Flat",
    joinCode: overrides.joinCode ?? "ACEFGH",
    ownerId: overrides.ownerId ?? "m_owner",
    settings: overrides.settings ?? { proposalExpiryHours: 72 },
    createdAt: overrides.createdAt ?? "2026-01-01T00:00:00.000Z",
  };
}

export function chore(overrides: Partial<Chore> = {}): Chore {
  return {
    id: overrides.id ?? nextId("c"),
    partyId: overrides.partyId ?? "party",
    title: overrides.title ?? "Dishes",
    description: overrides.description,
    priority: overrides.priority ?? "high",
    frequency: overrides.frequency ?? { type: "daily" },
    rotationMemberIds: overrides.rotationMemberIds ?? [],
    currentRotationIndex: overrides.currentRotationIndex ?? 0,
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? "2026-01-01T00:00:00.000Z",
  };
}

export function block(overrides: Partial<ScheduleBlock> = {}): ScheduleBlock {
  return {
    id: overrides.id ?? nextId("b"),
    memberId: overrides.memberId ?? "m",
    partyId: overrides.partyId ?? "party",
    label: overrides.label ?? "Away",
    startDate: overrides.startDate ?? "2026-06-01",
    endDate: overrides.endDate ?? "2026-06-07",
    recurrence: overrides.recurrence,
  };
}
