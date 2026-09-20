import DarkModeIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeIcon from "@mui/icons-material/LightModeOutlined";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useColorScheme } from "@mui/material/styles";

export function ThemeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  if (!mode) return null; // not resolved on first render (SSR-safe)
  const resolved = mode === "system" ? systemMode : mode;
  const next = resolved === "dark" ? "light" : "dark";

  return (
    <Tooltip title={`Switch to ${next} theme`}>
      <IconButton onClick={() => setMode(next)} aria-label={`Switch to ${next} theme`} color="inherit">
        {resolved === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
