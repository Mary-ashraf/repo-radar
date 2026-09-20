import { createTheme } from "@mui/material/styles";

const FONT = '"Instrument Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/**
 * Light/dark via MUI's CSS-variables color schemes: the mode is persisted and
 * follows the OS by default, with no flash of the wrong theme.
 */
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: "data" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#0f766e" },
        secondary: { main: "#b45309" },
        background: { default: "#eef3f3", paper: "#ffffff" },
        divider: "#d3dfdf",
      },
    },
    dark: {
      palette: {
        primary: { main: "#2dd4bf" },
        secondary: { main: "#fbbf24" },
        background: { default: "#0b1417", paper: "#111d21" },
        divider: "#223339",
      },
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: FONT,
    h1: { fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: "none" } } },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTab: { styleOverrides: { root: { minHeight: 48 } } },
  },
});
