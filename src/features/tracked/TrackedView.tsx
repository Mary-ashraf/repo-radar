import RefreshIcon from "@mui/icons-material/Refresh";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { lazy, Suspense } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { refreshAllRepos } from "./operations";
import { selectIsRefreshingAny, selectTrackedIds } from "./selectors";
import { TrackedRepoCard } from "./TrackedRepoCard";

// The chart library is the heaviest dependency; load it only when this view is opened.
const StarsChart = lazy(() => import("../chart/StarsChart").then((m) => ({ default: m.StarsChart })));

export function TrackedView({ onBrowse }: { onBrowse: () => void }) {
  const dispatch = useAppDispatch();
  const ids = useAppSelector(selectTrackedIds);
  const isRefreshing = useAppSelector(selectIsRefreshingAny);

  if (ids.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h6">Nothing tracked yet</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          Track a repository from search to see its stars, open issues and last commit here.
        </Typography>
        <Button variant="contained" onClick={onBrowse}>
          Search repositories
        </Button>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography color="text.secondary">
          {ids.length} {ids.length === 1 ? "repository" : "repositories"}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          disabled={isRefreshing}
          onClick={() => void dispatch(refreshAllRepos())}
          startIcon={isRefreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
        >
          Refresh all
        </Button>
      </Stack>

      <Suspense fallback={<Skeleton variant="rounded" height={220} />}>
        <StarsChart />
      </Suspense>

      <Stack spacing={1.5} component="section" aria-label="Tracked repositories">
        {ids.map((id) => (
          <TrackedRepoCard key={id} id={id} />
        ))}
      </Stack>
    </Stack>
  );
}
