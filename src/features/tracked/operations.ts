import { createAsyncThunk, type ThunkAction, type UnknownAction } from "@reduxjs/toolkit";
import type { RepoSummary } from "../../api/types";
import { mapWithConcurrency } from "../../shared/concurrency";
import { refreshRepo } from "./refreshRepo";
import { repoTracked } from "./trackedSlice";
import type { TrackedRootShape } from "./types";

type AppThunk = ThunkAction<void, TrackedRootShape, unknown, UnknownAction>;

/** GitHub's secondary rate limits punish bursts, so refresh-all is throttled. */
const REFRESH_CONCURRENCY = 4;

/** Track a repo, then immediately fetch its full stats (incl. last commit). */
export const trackRepo =
  (repo: RepoSummary): AppThunk =>
  (dispatch) => {
    dispatch(repoTracked(repo));
    void dispatch(refreshRepo(repo.id));
  };

export const refreshAllRepos = createAsyncThunk<void, void, { state: TrackedRootShape }>(
  "tracked/refreshAll",
  async (_, { getState, dispatch }) => {
    await mapWithConcurrency(getState().tracked.ids, REFRESH_CONCURRENCY, (id) =>
      dispatch(refreshRepo(id)),
    );
  },
);

/** Startup: fetch anything that was tracked but never got stats (e.g. failed first load). */
export const refreshUnloadedRepos = createAsyncThunk<void, void, { state: TrackedRootShape }>(
  "tracked/refreshUnloaded",
  async (_, { getState, dispatch }) => {
    const { ids, entities } = getState().tracked;
    const pending = ids.filter((id) => entities[id]?.stats == null);
    await mapWithConcurrency(pending, REFRESH_CONCURRENCY, (id) => dispatch(refreshRepo(id)));
  },
);
