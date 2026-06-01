import { NavLink } from "react-router-dom";
import { useStore } from "../store.js";
import { pendingForMember } from "../lib/selectors.js";
import {
  BellIcon,
  CalendarIcon,
  ChoreIcon,
  HomeIcon,
  PartyIcon,
} from "./icons.js";

const TABS = [
  { to: "/", label: "Home", Icon: HomeIcon, end: true },
  { to: "/chores", label: "Chores", Icon: ChoreIcon, end: false },
  { to: "/schedule", label: "Schedule", Icon: CalendarIcon, end: false },
  { to: "/party", label: "Party", Icon: PartyIcon, end: false },
  { to: "/proposals", label: "Inbox", Icon: BellIcon, end: false },
];

export function TabBar() {
  const pendingCount = useStore(
    (s) => pendingForMember(s.proposals, s.currentMemberId).length,
  );

  return (
    <nav
      className="sticky bottom-0 z-30 mx-auto flex max-w-app items-stretch justify-around border-t border-border bg-white px-2 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="focusable group relative flex flex-1 flex-col items-center gap-0.5 py-2 text-ink-muted aria-[current=page]:text-ink"
        >
          {({ isActive }) => (
            <>
              {/* Top-edge active indicator */}
              {isActive && (
                <span className="absolute inset-x-1/4 top-0 h-[2px] rounded-b-full bg-ink" />
              )}
              <span className="relative">
                <Icon
                  className={`h-6 w-6 transition-transform ${
                    isActive ? "scale-105" : "group-active:scale-95"
                  }`}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
                {to === "/proposals" && pendingCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </span>
              <span className={`text-[11px] ${isActive ? "font-bold" : "font-medium"}`}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
