import type { EntityState } from "@reduxjs/toolkit";
import type { AppError, RepoStats, RepoSummary } from "../../api/types";

export type LoadStatus = "idle" | "loading" | "succeeded" | "failed";

/** Identity/metadata of a repo; volatile numbers live in `stats`. */
export type RepoIdentity = Omit<RepoSummary, "stars" | "openIssues">;

export interface TrackedRepo extends RepoIdentity {
  trackedAt: number;
  /** Last successful snapshot. Kept while refreshing or after a failed refresh. */
  stats: RepoStats | null;
  /** Per-repo request state: this is what makes loading/errors independent. */
  status: LoadStatus;
  error: AppError | null;
}

export type TrackedState = EntityState<TrackedRepo, number>;

/**
 * The minimal store shape this feature needs. Thunks and selectors depend on
 * this instead of the app-wide RootState, which avoids circular type inference
 * (RootState -> slice -> thunk -> RootState).
 */
export interface TrackedRootShape {
  tracked: TrackedState;
}
