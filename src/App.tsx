import RadarIcon from "@mui/icons-material/Radar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import CssBaseline from "@mui/material/CssBaseline";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { ThemeProvider } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useAppSelector } from "./app/hooks";
import { SearchPanel } from "./features/search/SearchPanel";
import { selectTrackedCount } from "./features/tracked/selectors";
import { TrackedView } from "./features/tracked/TrackedView";
import { theme } from "./theme/theme";
import { ThemeToggle } from "./theme/ThemeToggle";

type View = "search" | "tracked";

export default function App() {
  const [view, setView] = useState<View>("search");
  const trackedCount = useAppSelector(selectTrackedCount);

  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline enableColorScheme />
      <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <RadarIcon color="primary" fontSize="large" />
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
              Repo Radar
            </Typography>
          </Stack>
          <ThemeToggle />
        </Stack>

        <Tabs value={view} onChange={(_, v: View) => setView(v)} sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tab value="search" label="Search" id="tab-search" aria-controls="panel-search" />
          <Tab
            value="tracked"
            id="tab-tracked"
            aria-controls="panel-tracked"
            sx={{ "& .MuiBox-root": { marginRight: "12px" } }}
            label={
              <Badge badgeContent={trackedCount} color="primary" sx={{ "& .MuiBadge-badge": { top: 8 } }}>
                <Box component="span" sx={{ pr: trackedCount ? 0.5 : 0 }}>
                  Tracked
                </Box>
              </Badge>
            }
          />
        </Tabs>

        <Box role="tabpanel" id={`panel-${view}`} aria-labelledby={`tab-${view}`}>
          {/* Keep search mounted so its query/results survive tab switches. */}
          <Box hidden={view !== "search"}>
            <SearchPanel />
          </Box>
          {view === "tracked" && <TrackedView onBrowse={() => setView("search")} />}
        </Box>
      </Container>
    </ThemeProvider>
  );
}
