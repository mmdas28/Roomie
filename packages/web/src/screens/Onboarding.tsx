import { isValidJoinCode, normalizeJoinCode } from "@roomie/core";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useStore } from "../store.js";

type Mode = "welcome" | "create" | "join";

/**
 * First-run flow. Either create a party (become owner) or enter a join code.
 * Phase 1 is single-device, so "join" spins up a local household you own — the
 * real cross-device join + owner approval lands with the backend (Phase 2).
 */
export function Onboarding() {
  const [mode, setMode] = useState<Mode>("welcome");
  const createParty = useStore((s) => s.createParty);

  const [partyName, setPartyName] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const canCreate = name.trim().length > 0;
  const canJoin = name.trim().length > 0 && isValidJoinCode(code);

  return (
    <div className="mx-auto flex min-h-dvh max-w-app flex-col px-6">
      <div className="flex flex-1 flex-col justify-center py-10">
        <AnimatePresence mode="wait">
          {mode === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-accent text-4xl text-white shadow-card">
                <span aria-hidden="true">🏠</span>
              </div>
              <h1 className="text-2xl font-bold text-ink">Roomie</h1>
              <p className="mt-2 text-ink-muted">
                Chores and schedules with your roommates — fair by design.
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <button
                  className="btn-primary"
                  onClick={() => setMode("create")}
                >
                  Start a household
                </button>
                <button className="btn-ghost" onClick={() => setMode("join")}>
                  I have a join code
                </button>
              </div>
            </motion.div>
          )}

          {mode === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <BackLink onClick={() => setMode("welcome")} />
              <h1 className="mt-4 text-xl font-bold text-ink">
                Name your household
              </h1>
              <p className="mt-1 text-sm text-ink-muted">
                You can change this any time.
              </p>
              <label className="mt-6 block text-sm font-medium text-ink">
                Household name
                <input
                  className="input mt-1.5"
                  placeholder="The Treehouse"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  autoFocus
                />
              </label>
              <label className="mt-4 block text-sm font-medium text-ink">
                Your name
                <input
                  className="input mt-1.5"
                  placeholder="Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <button
                className="btn-primary mt-8 w-full"
                disabled={!canCreate}
                onClick={() => createParty(partyName, name)}
              >
                Create household
              </button>
            </motion.div>
          )}

          {mode === "join" && (
            <motion.div
              key="join"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <BackLink onClick={() => setMode("welcome")} />
              <h1 className="mt-4 text-xl font-bold text-ink">Enter join code</h1>
              <p className="mt-1 text-sm text-ink-muted">
                Ask whoever set up your household for the 6-character code.
              </p>
              <input
                className="input mt-6 text-center font-mono text-2xl tracking-[0.4em]"
                placeholder="ACEFGH"
                inputMode="text"
                autoCapitalize="characters"
                maxLength={8}
                value={code}
                onChange={(e) => setCode(normalizeJoinCode(e.target.value))}
                autoFocus
              />
              <label className="mt-4 block text-sm font-medium text-ink">
                Your name
                <input
                  className="input mt-1.5"
                  placeholder="Sam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <button
                className="btn-primary mt-8 w-full"
                disabled={!canJoin}
                onClick={() => createParty("Our Place", name)}
              >
                Request to join
              </button>
              <p className="mt-3 text-center text-xs text-ink-muted">
                Heads up: cross-device joining arrives with accounts. For now this
                sets up a household on this device.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focusable text-sm font-medium text-ink-muted hover:text-ink"
    >
      ← Back
    </button>
  );
}
