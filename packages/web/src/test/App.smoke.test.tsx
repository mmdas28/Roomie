import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../App.js";
import { useStore } from "../store.js";

function renderApp() {
  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
}

/** Walk onboarding → quick start, leaving the app on Home as `ownerName`. */
async function onboard(householdName: string, ownerName: string, skip = false) {
  fireEvent.click(screen.getByText("Start a household"));
  fireEvent.change(await screen.findByPlaceholderText("The Treehouse"), {
    target: { value: householdName },
  });
  fireEvent.change(screen.getByPlaceholderText("Alex"), {
    target: { value: ownerName },
  });
  fireEvent.click(screen.getByText("Create household"));
  await screen.findByText("Quick start");
  fireEvent.click(
    skip
      ? screen.getByText("I'll add chores myself")
      : screen.getByText(/Add \d+ chores/),
  );
}

beforeEach(() => {
  localStorage.clear();
  useStore.getState().resetEverything();
});

afterEach(cleanup);

describe("Roomie app — full first-run flow", () => {
  it("onboards, runs quick start, and renders every tab without crashing", async () => {
    const errors: string[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...args) => {
      const msg = String(args[0] ?? "");
      if (!msg.includes("not wrapped in act")) errors.push(msg);
    });

    renderApp();
    expect(screen.getByText("Roomie")).toBeTruthy();

    await onboard("The Treehouse", "Alex");

    // Home greets the owner.
    expect(await screen.findByText(/Hey Alex/)).toBeTruthy();

    // Chores lists seeded presets.
    fireEvent.click(screen.getByRole("link", { name: /Chores/ }));
    expect(await screen.findByText("Wash the dishes")).toBeTruthy();

    // Schedule.
    fireEvent.click(screen.getByRole("link", { name: /Schedule/ }));
    expect(await screen.findByRole("heading", { name: "Schedule" })).toBeTruthy();

    // Party shows a valid 6-char join code.
    fireEvent.click(screen.getByRole("link", { name: /Party/ }));
    expect(await screen.findByText("Join code")).toBeTruthy();
    expect(useStore.getState().party?.joinCode).toMatch(/^[A-Z0-9]{6}$/);

    // Inbox empty state.
    fireEvent.click(screen.getByRole("link", { name: /Inbox/ }));
    expect(await screen.findByText("All clear")).toBeTruthy();

    expect(errors).toEqual([]);
    spy.mockRestore();
  });

  it("adds a custom chore through the three-field form", async () => {
    renderApp();
    await onboard("Flat 2B", "Sam", true);

    fireEvent.click(screen.getByRole("link", { name: /Chores/ }));
    fireEvent.click(await screen.findByText("Add a chore"));

    fireEvent.change(await screen.findByPlaceholderText(/Water the plants/), {
      target: { value: "Water the plants" },
    });
    fireEvent.click(screen.getByText("Add chore"));

    expect(await screen.findByText("Water the plants")).toBeTruthy();
    expect(useStore.getState().chores).toHaveLength(1);
  });

  it("keeps a shared-chore change pending until a roommate approves it", async () => {
    renderApp();
    await onboard("Loft", "Ana", true);

    // Seed a second roommate and a shared chore via the store.
    const store = useStore.getState();
    const bobId = store.addRoommate("Bob", "active");
    const ownerId = store.party!.ownerId;
    store.addChore({ title: "Trash", priority: "high", memberIds: [ownerId, bobId] });

    // Ana proposes a rename — affects Bob, so it must wait for him.
    const choreId = useStore.getState().chores[0].id;
    useStore.getState().propose({
      type: "chore_edit",
      choreId,
      changes: { title: "Take out the trash" },
    });
    expect(useStore.getState().chores[0].title).toBe("Trash");

    // Switch to Bob and approve in the Inbox.
    useStore.getState().setCurrentMember(bobId);
    fireEvent.click(screen.getByRole("link", { name: /Inbox/ }));
    const text = await screen.findByText(/wants to/);
    fireEvent.click(within(text.closest("div")!).getByText("Looks good"));

    expect(useStore.getState().chores[0].title).toBe("Take out the trash");
  });
});
