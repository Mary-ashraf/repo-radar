import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import StarIcon from "@mui/icons-material/StarBorderRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { memo } from "react";
import type { RepoSummary } from "../../api/types";
import { formatCompact, formatNumber } from "../../shared/format";

interface Props {
  repo: RepoSummary;
  isTracked: boolean;
  onTrack: (repo: RepoSummary) => void;
  onUntrack: (id: number) => void;
}

export const SearchResultItem = memo(function SearchResultItem({ repo, isTracked, onTrack, onUntrack }: Props) {
  return (
    <Stack direction="row" spacing={2} sx={{ py: 2, alignItems: "flex-start" }}>
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
        <Stack direction="row" spacing={1.5} useFlexGap sx={{ mt: 1, alignItems: "center", flexWrap: "wrap" }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }} title={`${formatNumber(repo.stars)} stars`}>
            <StarIcon fontSize="small" color="secondary" />
            <Typography variant="body2">{formatCompact(repo.stars)}</Typography>
          </Stack>
          {repo.language && <Chip size="small" variant="outlined" label={repo.language} />}
        </Stack>
      </Box>
      {isTracked ? (
        <Button size="small" variant="outlined" color="inherit" startIcon={<CheckIcon />} onClick={() => onUntrack(repo.id)} aria-label={`Untrack ${repo.fullName}`}>
          Tracked
        </Button>
      ) : (
        <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => onTrack(repo)} aria-label={`Track ${repo.fullName}`}>
          Track
        </Button>
      )}
    </Stack>
  );
});
