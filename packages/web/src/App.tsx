import { AnimatePresence, motion } from "framer-motion";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AppHeader } from "./components/AppHeader.js";
import { TabBar } from "./components/TabBar.js";
import { Chores } from "./screens/Chores.js";
import { ChoreForm } from "./screens/ChoreForm.js";
import { Home } from "./screens/Home.js";
import { Onboarding } from "./screens/Onboarding.js";
import { Party } from "./screens/Party.js";
import { Proposals } from "./screens/Proposals.js";
import { QuickStart } from "./screens/QuickStart.js";
import { Schedule } from "./screens/Schedule.js";
import { useStore } from "./store.js";

export function App() {
  const hasParty = useStore((s) => s.party !== null);
  const quickStartDone = useStore((s) => s.quickStartDone);

  if (!hasParty) return <Onboarding />;
  if (!quickStartDone) return <QuickStart />;

  return <MainApp />;
}

function MainApp() {
  const location = useLocation();

  return (
    <div className="mx-auto flex min-h-dvh max-w-app flex-col bg-white">
      <AppHeader />
      <main className="flex-1 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={routeKey(location.pathname)}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/chores" element={<Chores />} />
              <Route path="/chores/new" element={<ChoreForm />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/party" element={<Party />} />
              <Route path="/proposals" element={<Proposals />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <TabBar />
    </div>
  );
}

/** Group sub-routes so transitions only fire on top-level tab changes. */
function routeKey(pathname: string): string {
  return "/" + (pathname.split("/")[1] ?? "");
}
