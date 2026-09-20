import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchRepoSnapshot, toAppError } from "../../api/githubClient";
import type { AppError } from "../../api/types";
import type { TrackedRootShape } from "./types";

/**
 * Refreshes a single tracked repo. Status transitions are handled by the slice
 * via pending/fulfilled/rejected, so components never juggle flags themselves.
 */
export const refreshRepo = createAsyncThunk<
  Awaited<ReturnType<typeof fetchRepoSnapshot>>,
  number,
  { state: TrackedRootShape; rejectValue: AppError }
>(
  "tracked/refreshRepo",
  async (id, { signal, rejectWithValue }) => {
    try {
      return await fetchRepoSnapshot(id, signal);
    } catch (e) {
      return rejectWithValue(toAppError(e));
    }
  },
  {
    // Dedupe: ignore a refresh if that repo is already in flight (or was untracked).
    condition: (id, { getState }) => {
      const repo = getState().tracked.entities[id];
      return repo !== undefined && repo.status !== "loading";
    },
  },
);
