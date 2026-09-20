import { BarChart } from "@mui/x-charts/BarChart";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useAppSelector } from "../../app/hooks";
import { formatCompact, formatNumber, truncate } from "../../shared/format";
import { selectStarsChartData } from "../tracked/selectors";

const BAR_HEIGHT = 40;
const CHART_CHROME = 56; // axis + padding

/** Stars per tracked repository. Reads the memoized selector, so it only re-renders when stars change. */
export function StarsChart() {
  const data = useAppSelector(selectStarsChartData);
  const theme = useTheme();

  if (data.length === 0) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Stars per repository
      </Typography>
      <BarChart
        dataset={data}
        layout="horizontal"
        hideLegend
        height={data.length * BAR_HEIGHT + CHART_CHROME}
        yAxis={[
          {
            scaleType: "band",
            dataKey: "label",
            width: "auto",
            valueFormatter: (value: string, ctx) => (ctx.location === "tick" ? truncate(value, 24) : value),
          },
        ]}
        xAxis={[{ valueFormatter: (v: number) => formatCompact(v) }]}
        series={[
          {
            dataKey: "stars",
            label: "Stars",
            color: theme.vars?.palette.primary.main ?? theme.palette.primary.main,
            valueFormatter: (v) => (v == null ? "" : formatNumber(v)),
          },
        ]}
        aria-label="Bar chart of stars per tracked repository"
      />
    </Paper>
  );
}
