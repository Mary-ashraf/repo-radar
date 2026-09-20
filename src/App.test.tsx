import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { setupStore } from "./app/store";
import { json, mockGithub } from "./test/github";

// The chart is covered by a selector test; jsdom can't lay out SVG charts.
vi.mock("./features/chart/StarsChart", () => ({ StarsChart: () => <div data-testid="stars-chart" /> }));

const renderApp = () => render(<Provider store={setupStore()}><App /></Provider>);

describe("Repo Radar flow", () => {
  it("debounces search so one request is sent for a burst of typing", async () => {
    const fetchMock = mockGithub();
    renderApp();
    await userEvent.type(screen.getByRole("textbox", { name: /search github/i }), "react");

    expect(await screen.findByText("octo/repo1", {}, { timeout: 3000 })).toBeInTheDocument();
    const searches = fetchMock.mock.calls.filter(([u]) => String(u).includes("/search/repositories"));
    expect(searches).toHaveLength(1);
  });

  it("searches, tracks a repo and shows its stats in the Tracked view", async () => {
    mockGithub();
    renderApp();
    await userEvent.type(screen.getByRole("textbox", { name: /search github/i }), "react");
    await userEvent.click(await screen.findByRole("button", { name: "Track octo/repo1" }, { timeout: 3000 }));
    expect(await screen.findByRole("button", { name: "Untrack octo/repo1" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: /tracked/i }));
    const card = (await screen.findByRole("link", { name: "octo/repo1" })).closest("article")!;
    await waitFor(() => expect(within(card).getByText("100")).toBeInTheDocument()); // stars
    expect(within(card).getByText("Open issues")).toBeInTheDocument();
    expect(within(card).getByText("Last commit")).toBeInTheDocument();
    expect(await screen.findByTestId("stars-chart")).toBeInTheDocument();
  });

  it("shows a per-repo error with retry without affecting other repos", async () => {
    let failRepo2 = true;
    mockGithub((url) => (failRepo2 && url.pathname === "/repositories/2" ? json({ message: "x" }, { status: 500 }) : undefined));
    renderApp();
    await userEvent.type(screen.getByRole("textbox", { name: /search github/i }), "react");
    await userEvent.click(await screen.findByRole("button", { name: "Track octo/repo1" }, { timeout: 3000 }));
    await userEvent.click(screen.getByRole("button", { name: "Track octo/repo2" }));
    await userEvent.click(screen.getByRole("tab", { name: /tracked/i }));

    const card2 = (await screen.findByRole("link", { name: "octo/repo2" })).closest("article")!;
    const card1 = screen.getByRole("link", { name: "octo/repo1" }).closest("article")!;
    await waitFor(() => expect(within(card2).getByRole("alert")).toBeInTheDocument());
    expect(within(card1).queryByRole("alert")).not.toBeInTheDocument();

    failRepo2 = false;
    await userEvent.click(within(card2).getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(within(card2).queryByRole("alert")).not.toBeInTheDocument());
    expect(within(card2).getByText("200")).toBeInTheDocument();
  });
});
