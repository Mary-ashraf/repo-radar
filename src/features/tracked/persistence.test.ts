import { describe, expect, it } from "vitest";
import { setupStore } from "../../app/store";
import type { RepoSummary } from "../../api/types";
import { mockGithub } from "../../test/github";
import { trackRepo } from "./operations";
import { attachPersistence, loadTrackedState, STORAGE_KEY } from "./persistence";

const repo: RepoSummary = {
  id: 1, fullName: "octo/repo1", name: "repo1", owner: "octo", ownerAvatarUrl: "", htmlUrl: "https://github.com/octo/repo1",
  description: null, language: null, stars: 0, openIssues: 0,
};

const memoryStorage = () => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
};

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("persistence", () => {
  it("round-trips tracked repos and resets transient status", async () => {
    mockGithub();
    const storage = memoryStorage();
    const store = setupStore();
    attachPersistence(store, storage);
    store.dispatch(trackRepo(repo));
    await flush();

    const restored = loadTrackedState(storage)!;
    const entry = restored.entities[1]!;
    expect(entry.fullName).toBe("octo/repo1");
    expect(entry.stats?.stars).toBe(100); // last good stats survive a reload
    expect(entry).toMatchObject({ status: "idle", error: null });
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!).repos[0]).not.toHaveProperty("status");
  });

  it("removes untracked repos from storage", async () => {
    mockGithub();
    const storage = memoryStorage();
    const store = setupStore();
    attachPersistence(store, storage);
    store.dispatch(trackRepo(repo));
    await flush();
    store.dispatch({ type: "tracked/repoUntracked", payload: 1 });
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!).repos).toHaveLength(0);
  });

  it("ignores corrupt or foreign data instead of crashing", () => {
    expect(loadTrackedState({ getItem: () => "{not json" })).toBeUndefined();
    expect(loadTrackedState({ getItem: () => JSON.stringify({ version: 99, repos: [] }) })).toBeUndefined();
    const withJunk = loadTrackedState({ getItem: () => JSON.stringify({ version: 1, repos: [{ id: "nope" }, null] }) });
    expect(withJunk?.ids).toEqual([]);
  });
});
