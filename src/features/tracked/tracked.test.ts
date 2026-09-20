import { describe, expect, it } from "vitest";
import { setupStore } from "../../app/store";
import type { RepoSummary } from "../../api/types";
import { COMMIT_DATE, ghRepo, json, mockGithub } from "../../test/github";
import { refreshAllRepos, trackRepo } from "./operations";
import { refreshRepo } from "./refreshRepo";
import { selectStarsChartData, selectTrackedById } from "./selectors";
import { repoUntracked } from "./trackedSlice";

const summary = (id: number): RepoSummary => ({
  id,
  fullName: `octo/repo${id}`,
  name: `repo${id}`,
  owner: "octo",
  ownerAvatarUrl: "",
  htmlUrl: "",
  description: null,
  language: null,
  stars: 0,
  openIssues: 0,
});

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("tracked repos", () => {
  it("tracks a repo, goes loading, then stores stats incl. last commit", async () => {
    mockGithub();
    const store = setupStore();

    store.dispatch(trackRepo(summary(1)));
    expect(selectTrackedById(store.getState(), 1)?.status).toBe("loading");

    await flush();
    const repo = selectTrackedById(store.getState(), 1)!;
    expect(repo.status).toBe("succeeded");
    expect(repo.stats).toMatchObject({ stars: 100, openIssues: 1, lastCommitAt: COMMIT_DATE });
  });

  it("keeps loading and error state independent per repo", async () => {
    mockGithub((url) => (url.pathname === "/repositories/2" ? json({ message: "Not Found" }, { status: 404 }) : undefined));
    const store = setupStore();
    store.dispatch(trackRepo(summary(1)));
    store.dispatch(trackRepo(summary(2)));
    await flush();

    const s = store.getState();
    expect(selectTrackedById(s, 1)?.status).toBe("succeeded");
    expect(selectTrackedById(s, 2)).toMatchObject({ status: "failed", error: { kind: "not_found" } });
  });

  it("keeps the last good stats when a refresh fails, and recovers on retry", async () => {
    let fail = false;
    mockGithub(() => (fail ? json({ message: "boom" }, { status: 500 }) : undefined));
    const store = setupStore();
    store.dispatch(trackRepo(summary(1)));
    await flush();

    fail = true;
    await store.dispatch(refreshRepo(1));
    let repo = selectTrackedById(store.getState(), 1)!;
    expect(repo.status).toBe("failed");
    expect(repo.stats?.stars).toBe(100);

    fail = false;
    await store.dispatch(refreshRepo(1));
    repo = selectTrackedById(store.getState(), 1)!;
    expect(repo).toMatchObject({ status: "succeeded", error: null });
  });

  it("treats an empty repository (409 on commits) as 'no commits', not an error", async () => {
    mockGithub((url) => (url.pathname.endsWith("/commits") ? json({ message: "Git Repository is empty." }, { status: 409 }) : undefined));
    const store = setupStore();
    store.dispatch(trackRepo(summary(1)));
    await flush();
    expect(selectTrackedById(store.getState(), 1)).toMatchObject({ status: "succeeded", stats: { lastCommitAt: null } });
  });

  it("reports a friendly rate-limit error", async () => {
    mockGithub(() => json({ message: "API rate limit exceeded" }, { status: 403, headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1893456000" } }));
    const store = setupStore();
    store.dispatch(trackRepo(summary(1)));
    await flush();
    const repo = selectTrackedById(store.getState(), 1)!;
    expect(repo.error?.kind).toBe("rate_limit");
    expect(repo.error?.message).toMatch(/rate limit/i);
  });

  it("does not resurrect a repo untracked while its request is in flight", async () => {
    mockGithub();
    const store = setupStore();
    store.dispatch(trackRepo(summary(1)));
    store.dispatch(repoUntracked(1));
    await flush();
    expect(store.getState().tracked.ids).toEqual([]);
  });

  it("dedupes concurrent refreshes of the same repo", async () => {
    const fetchMock = mockGithub();
    const store = setupStore();
    store.dispatch(trackRepo(summary(1)));
    await flush();
    fetchMock.mockClear();

    await Promise.all([store.dispatch(refreshRepo(1)), store.dispatch(refreshRepo(1))]);
    // one refresh = one repo call + one commits call
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("refresh-all throttles concurrency", async () => {
    let inFlight = 0;
    let peak = 0;
    mockGithub(async (url) => {
      if (!/^\/repositories\/\d+$/.test(url.pathname)) return undefined;
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      return json(ghRepo(Number(url.pathname.split("/")[2])));
    });
    const store = setupStore();
    for (let id = 1; id <= 12; id++) store.dispatch(trackRepo(summary(id)));
    await flush();
    await new Promise((r) => setTimeout(r, 100));
    peak = 0;

    await store.dispatch(refreshAllRepos());
    expect(peak).toBeLessThanOrEqual(4);
    expect(Object.values(store.getState().tracked.entities).every((r) => r.status === "succeeded")).toBe(true);
  });

  it("derives chart data sorted by stars, skipping repos without stats", async () => {
    mockGithub();
    const store = setupStore();
    store.dispatch(trackRepo(summary(1)));
    store.dispatch(trackRepo(summary(3)));
    await flush();
    store.dispatch(trackRepo(summary(2))); // still loading, no stats yet
    expect(selectStarsChartData(store.getState()).map((d) => d.id)).toEqual([3, 1]);
  });
});
