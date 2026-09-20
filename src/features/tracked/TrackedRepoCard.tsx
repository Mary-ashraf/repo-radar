import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import IssueIcon from "@mui/icons-material/ErrorOutlined";
import CommitIcon from "@mui/icons-material/History";
import RefreshIcon from "@mui/icons-material/Refresh";
import StarIcon from "@mui/icons-material/StarBorderRounded";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { memo, type ReactNode } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { formatDateTime, formatNumber, formatRelativeTime } from "../../shared/format";
import { refreshRepo } from "./refreshRepo";
import { selectTrackedById } from "./selectors";
import { repoUntracked } from "./trackedSlice";

function Stat({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
      <Box sx={{ display: "flex", color: "text.secondary" }} aria-hidden>
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ lineHeight: 1.2 }}>
          {label}
        </Typography>
        <Typography variant="body2" component="div" sx={{ fontWeight: 600 }}>
          {children}
        </Typography>
      </Box>
    </Stack>
  );
}

/**
 * Selects its own repo by id, so a refresh of one repo re-renders only this card:
 * loading and error state are fully independent.
 */
export const TrackedRepoCard = memo(function TrackedRepoCard({ id }: { id: number }) {
  const dispatch = useAppDispatch();
  const repo = useAppSelector((s) => selectTrackedById(s, id));
  if (!repo) return null;

  const { stats, status, error } = repo;
  const isLoading = status === "loading";
  const showSkeleton = isLoading && !stats;
  const retry = () => void dispatch(refreshRepo(id));

  return (
    <Paper variant="outlined" component="article" aria-busy={isLoading} sx={{ overflow: "hidden" }}>
      <Box sx={{ height: 3 }}>{isLoading && <LinearProgress aria-label={`Refreshing ${repo.fullName}`} sx={{ height: 3 }} />}</Box>
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
          <Avatar src={repo.ownerAvatarUrl} alt="" variant="rounded" sx={{ width: 40, height: 40 }} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Link href={repo.htmlUrl} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ fontWeight: 600, wordBreak: "break-word" }}>
              {repo.fullName}
            </Link>
            {repo.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {repo.description}
              </Typography>
            )}
          </Box>
          <Stack direction="row">
            <Tooltip title="Refresh">
              <span>
                <IconButton size="small" onClick={retry} disabled={isLoading} aria-label={`Refresh ${repo.fullName}`}>
                  {isLoading ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Untrack">
              <IconButton size="small" onClick={() => dispatch(repoUntracked(id))} aria-label={`Untrack ${repo.fullName}`}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Stack direction="row" useFlexGap sx={{ mt: 2, columnGap: 4, rowGap: 1.5, flexWrap: "wrap" }}>
          <Stat icon={<StarIcon fontSize="small" />} label="Stars">
            {showSkeleton ? <Skeleton width={48} /> : stats ? formatNumber(stats.stars) : "–"}
          </Stat>
          <Stat icon={<IssueIcon fontSize="small" />} label="Open issues">
            {showSkeleton ? <Skeleton width={48} /> : stats ? formatNumber(stats.openIssues) : "–"}
          </Stat>
          <Stat icon={<CommitIcon fontSize="small" />} label="Last commit">
            {showSkeleton ? (
              <Skeleton width={80} />
            ) : stats?.lastCommitAt ? (
              <Tooltip title={formatDateTime(stats.lastCommitAt)}>
                <time dateTime={stats.lastCommitAt}>{formatRelativeTime(stats.lastCommitAt)}</time>
              </Tooltip>
            ) : stats ? (
              "No commits yet"
            ) : (
              "–"
            )}
          </Stat>
        </Stack>

        {status === "failed" && error && (
          <Alert
            severity={error.kind === "rate_limit" ? "warning" : "error"}
            sx={{ mt: 2 }}
            action={
              <Button color="inherit" size="small" onClick={retry}>
                Retry
              </Button>
            }
          >
            {error.message}
            {stats && ` Showing data from ${formatRelativeTime(stats.fetchedAt)}.`}
          </Alert>
        )}

        {stats && status !== "failed" && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
            Updated {formatRelativeTime(stats.fetchedAt)}
          </Typography>
        )}
      </Box>
    </Paper>
  );
});
