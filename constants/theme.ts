/**
 * GMB Everywhere Mobile - Theme Configuration
 * Color palette inspired by GMB Everywhere's warm terracotta branding
 */

import { Platform } from "react-native";

// Primary brand colors
const terracotta = "#C4704B";
const terracottaDark = "#A85A3A";
const terracottaLight = "#E8C4B4";

export const Colors = {
  light: {
    text: "#1A1A1A",
    textSecondary: "#666666",
    textDisabled: "#AAAAAA",
    background: "#FDF8F5",
    surface: "#FFFFFF",
    tint: terracotta,
    tintDark: terracottaDark,
    tintLight: terracottaLight,
    icon: "#687076",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: terracotta,
    border: "#E5E5E5",
    success: "#34A853",
    warning: "#FBBC04",
    error: "#EA4335",
    cardShadow: "rgba(0, 0, 0, 0.08)",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    textDisabled: "#666666",
    background: "#151718",
    surface: "#1E2022",
    tint: terracottaLight,
    tintDark: terracotta,
    tintLight: terracottaDark,
    icon: "#9BA1A6",
    tabIconDefault: "#687076",
    tabIconSelected: terracottaLight,
    border: "#2A2D2F",
    success: "#34A853",
    warning: "#FBBC04",
    error: "#EA4335",
    cardShadow: "rgba(0, 0, 0, 0.3)",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
