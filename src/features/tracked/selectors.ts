import { createSelector } from "@reduxjs/toolkit";
import { trackedAdapter } from "./trackedSlice";
import type { TrackedRootShape } from "./types";

const selectors = trackedAdapter.getSelectors((s: TrackedRootShape) => s.tracked);

export const selectTrackedById = selectors.selectById;
export const selectTrackedCount = selectors.selectTotal;

/** Newest tracked first. */
export const selectTrackedRepos = createSelector(selectors.selectAll, (repos) =>
  [...repos].sort((a, b) => b.trackedAt - a.trackedAt),
);

/** Ids only, so the list re-renders on add/remove but not on every stats change. */
export const selectTrackedIds = createSelector(selectTrackedRepos, (repos) => repos.map((r) => r.id));

export const selectTrackedIdSet = createSelector(selectors.selectIds, (ids) => new Set(ids));

export const selectIsRefreshingAny = (s: TrackedRootShape) =>
  selectors.selectAll(s).some((r) => r.status === "loading");

// `type` (not interface) so it satisfies the chart's index-signature dataset constraint.
export type StarsDatum = { id: number; label: string; stars: number };

export const selectStarsChartData = createSelector(selectTrackedRepos, (repos): StarsDatum[] =>
  repos
    .flatMap((r) => (r.stats ? [{ id: r.id, label: r.fullName, stars: r.stats.stars }] : []))
    .sort((a, b) => b.stars - a.stars),
);
