import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Fragment, useCallback, useState } from "react";
import { toAppErrorFromQuery, useSearchReposQuery } from "../../api/githubApi";
import type { RepoSummary } from "../../api/types";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useDebouncedValue } from "../../shared/useDebouncedValue";
import { trackRepo } from "../tracked/operations";
import { selectTrackedIdSet } from "../tracked/selectors";
import { repoUntracked } from "../tracked/trackedSlice";
import { SearchResultItem } from "./SearchResultItem";

const DEBOUNCE_MS = 400;
const MIN_CHARS = 2;
const SUGGESTIONS = ["react", "vite", "redux-toolkit", "mui"];

export function SearchPanel() {
  const dispatch = useAppDispatch();
  const trackedIds = useAppSelector(selectTrackedIdSet);

  const [input, setInput] = useState("");
  const term = input.trim();
  const debouncedTerm = useDebouncedValue(term, DEBOUNCE_MS);
  const canSearch = debouncedTerm.length >= MIN_CHARS;

  const { data, error: rawError, isFetching, refetch } = useSearchReposQuery(debouncedTerm, { skip: !canSearch });
  const error = rawError ? toAppErrorFromQuery(rawError) : null;
  const isWaiting = term !== debouncedTerm; // user is still typing
  const isBusy = canSearch && (isFetching || isWaiting);

  const handleTrack = useCallback((repo: RepoSummary) => dispatch(trackRepo(repo)), [dispatch]);
  const handleUntrack = useCallback((id: number) => dispatch(repoUntracked(id)), [dispatch]);

  return (
    <Stack spacing={2}>
      <TextField
        fullWidth
        autoFocus
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Search GitHub repositories"
        slotProps={{
          htmlInput: { "aria-label": "Search GitHub repositories" },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: input && (
              <InputAdornment position="end">
                <IconButton size="small" aria-label="Clear search" onClick={() => setInput("")}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Box sx={{ height: 4 }}>{isBusy && <LinearProgress aria-label="Searching" />}</Box>

      {term.length === 0 && (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography variant="h6">Find a repository to track</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            Search by name, topic or description, then track the ones you want to watch.
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{ justifyContent: "center", flexWrap: "wrap" }}>
            {SUGGESTIONS.map((s) => (
              <Chip key={s} label={s} onClick={() => setInput(s)} variant="outlined" />
            ))}
          </Stack>
        </Box>
      )}

      {term.length > 0 && !canSearch && !isWaiting && (
        <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
          Type at least {MIN_CHARS} characters to search.
        </Typography>
      )}

      {canSearch && error && (
        <Alert
          severity={error.kind === "rate_limit" ? "warning" : "error"}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          {error.message}
        </Alert>
      )}

      {canSearch && !error && data && data.length === 0 && !isFetching && (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          No repositories found for “{debouncedTerm}”. Try a different keyword.
        </Typography>
      )}

      {canSearch && data && data.length > 0 && (
        <Paper variant="outlined" sx={{ px: 2, opacity: isBusy ? 0.6 : 1, transition: "opacity 150ms" }}>
          {data.map((repo, i) => (
            <Fragment key={repo.id}>
              {i > 0 && <Divider />}
              <SearchResultItem repo={repo} isTracked={trackedIds.has(repo.id)} onTrack={handleTrack} onUntrack={handleUntrack} />
            </Fragment>
          ))}
        </Paper>
      )}
    </Stack>
  );
}
