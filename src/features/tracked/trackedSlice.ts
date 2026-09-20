import { createEntityAdapter, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RepoSummary } from "../../api/types";
import { refreshRepo } from "./refreshRepo";
import type { RepoIdentity, TrackedRepo } from "./types";

export const trackedAdapter = createEntityAdapter<TrackedRepo>();

const toIdentity = (r: RepoSummary): RepoIdentity => ({
  id: r.id,
  fullName: r.fullName,
  name: r.name,
  owner: r.owner,
  ownerAvatarUrl: r.ownerAvatarUrl,
  htmlUrl: r.htmlUrl,
  description: r.description,
  language: r.language,
});

const trackedSlice = createSlice({
  name: "tracked",
  initialState: trackedAdapter.getInitialState(),
  reducers: {
    repoTracked(state, action: PayloadAction<RepoSummary>) {
      // addOne is a no-op if the id already exists, so tracking is idempotent.
      trackedAdapter.addOne(state, {
        ...toIdentity(action.payload),
        trackedAt: Date.now(),
        stats: null,
        status: "idle",
        error: null,
      });
    },
    repoUntracked: trackedAdapter.removeOne,
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshRepo.pending, (state, action) => {
        trackedAdapter.updateOne(state, {
          id: action.meta.arg,
          changes: { status: "loading", error: null },
        });
      })
      .addCase(refreshRepo.fulfilled, (state, action) => {
        const { repo, stats } = action.payload;
        // updateOne ignores ids that were untracked while the request was in flight.
        trackedAdapter.updateOne(state, {
          id: action.meta.arg,
          changes: { ...toIdentity(repo), stats, status: "succeeded", error: null },
        });
      })
      .addCase(refreshRepo.rejected, (state, action) => {
        if (action.meta.condition) return; // skipped by `condition`, nothing was started
        const error = action.payload ?? { kind: "http" as const, message: action.error.message ?? "Refresh failed." };
        trackedAdapter.updateOne(state, {
          id: action.meta.arg,
          changes:
            error.kind === "aborted" ? { status: "idle", error: null } : { status: "failed", error },
        });
      });
  },
});

export const { repoTracked, repoUntracked } = trackedSlice.actions;
export default trackedSlice.reducer;
