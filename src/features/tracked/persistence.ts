import type { RepoStats } from "../../api/types";
import { trackedAdapter } from "./trackedSlice";
import type { TrackedRepo, TrackedRootShape, TrackedState } from "./types";

export const STORAGE_KEY = "repo-radar:tracked";
const VERSION = 1;

/** Only durable data is persisted; request status/errors always start fresh. */
type PersistedRepo = Omit<TrackedRepo, "status" | "error">;
interface PersistedShape {
  version: number;
  repos: PersistedRepo[];
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

const isStats = (v: unknown): v is RepoStats =>
  isObject(v) &&
  typeof v.stars === "number" &&
  typeof v.openIssues === "number" &&
  typeof v.fetchedAt === "number" &&
  (v.lastCommitAt === null || typeof v.lastCommitAt === "string");

/** Storage is user-editable and versioned, so validate instead of trusting it. */
const isPersistedRepo = (v: unknown): v is PersistedRepo =>
  isObject(v) &&
  typeof v.id === "number" &&
  typeof v.fullName === "string" &&
  typeof v.name === "string" &&
  typeof v.owner === "string" &&
  typeof v.ownerAvatarUrl === "string" &&
  typeof v.htmlUrl === "string" &&
  typeof v.trackedAt === "number" &&
  (v.stats === null || isStats(v.stats));

const selectAll = trackedAdapter.getSelectors().selectAll;

export function serializeTracked(state: TrackedState): string {
  const repos: PersistedRepo[] = selectAll(state).map(({ status: _s, error: _e, ...rest }) => rest);
  return JSON.stringify({ version: VERSION, repos } satisfies PersistedShape);
}

export function loadTrackedState(storage: Pick<Storage, "getItem"> = localStorage): TrackedState | undefined {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed) || parsed.version !== VERSION || !Array.isArray(parsed.repos)) return undefined;
    const repos = parsed.repos.filter(isPersistedRepo);
    return trackedAdapter.setAll(
      trackedAdapter.getInitialState(),
      repos.map((r) => ({ ...r, description: r.description ?? null, language: r.language ?? null, status: "idle", error: null })),
    );
  } catch {
    return undefined; // corrupted JSON / storage unavailable
  }
}

interface StoreLike {
  getState(): TrackedRootShape;
  subscribe(listener: () => void): () => void;
}

/** Writes tracked repos to storage whenever the durable part of the slice changes. */
export function attachPersistence(store: StoreLike, storage: Pick<Storage, "setItem"> = localStorage) {
  let prevState = store.getState().tracked;
  let prevJson = serializeTracked(prevState);
  return store.subscribe(() => {
    const state = store.getState().tracked;
    if (state === prevState) return; // cheap reference check for unrelated store updates
    prevState = state;
    const json = serializeTracked(state);
    if (json === prevJson) return; // status-only change (loading/failed), nothing durable changed
    prevJson = json;
    try {
      storage.setItem(STORAGE_KEY, json);
    } catch {
      /* quota exceeded / private mode: tracking still works for this session */
    }
  });
}
