import { isValidJoinCode, normalizeJoinCode } from "@roomie/core";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useStore } from "../store.js";

type Mode = "welcome" | "create" | "join";

export function Onboarding() {
  const [mode, setMode] = useState<Mode>("welcome");
  const createParty = useStore((s) => s.createParty);

  const [partyName, setPartyName] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const canCreate = name.trim().length > 0;
  const canJoin = name.trim().length > 0 && isValidJoinCode(code);

  const slide = {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: -16 },
    transition: { duration: 0.14 },
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-app flex-col px-6">
      <div className="flex flex-1 flex-col justify-center py-12">
        <AnimatePresence mode="wait">
          {mode === "welcome" && (
            <motion.div key="welcome" {...slide} className="text-center">
              {/* Wordmark — black square with emoji, then bold type below */}
              <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-lg bg-ink text-3xl">
                <span aria-hidden="true">🏠</span>
              </div>
              <h1 className="text-[32px] font-extrabold tracking-tight text-ink">
                Roomie
              </h1>
              <p className="mt-2 text-sm text-ink-muted">
                Chores and schedules with your roommates — fair by design.
              </p>
              <div className="mt-10 flex flex-col gap-3">
                <button className="btn-primary w-full" onClick={() => setMode("create")}>
                  Start a household
                </button>
                <button className="btn-ghost w-full" onClick={() => setMode("join")}>
                  I have a join code
                </button>
              </div>
            </motion.div>
          )}

          {mode === "create" && (
            <motion.div key="create" {...slide}>
              <BackLink onClick={() => setMode("welcome")} />
              <h1 className="mt-5 text-[28px] font-extrabold tracking-tight text-ink">
                Name your household
              </h1>
              <p className="mt-1.5 text-sm text-ink-muted">
                You can change this any time.
              </p>
              <label className="mt-7 block text-sm font-semibold text-ink">
                Household name
                <input
                  className="input mt-1.5"
                  placeholder="The Treehouse"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  autoFocus
                />
              </label>
              <label className="mt-4 block text-sm font-semibold text-ink">
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
            <motion.div key="join" {...slide}>
              <BackLink onClick={() => setMode("welcome")} />
              <h1 className="mt-5 text-[28px] font-extrabold tracking-tight text-ink">
                Enter join code
              </h1>
              <p className="mt-1.5 text-sm text-ink-muted">
                Ask whoever set up your household for the 6-character code.
              </p>
              <input
                className="input mt-7 text-center font-mono text-2xl font-bold tracking-[0.4em]"
                placeholder="ACEFGH"
                inputMode="text"
                autoCapitalize="characters"
                maxLength={8}
                value={code}
                onChange={(e) => setCode(normalizeJoinCode(e.target.value))}
                autoFocus
              />
              <label className="mt-4 block text-sm font-semibold text-ink">
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
                Cross-device joining arrives with accounts. For now this sets up a
                household on this device.
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
      className="focusable text-sm font-semibold text-ink-muted hover:text-ink"
    >
      ← Back
    </button>
  );
}
