import type { SeverityLevel } from "../data/types.js";

export const colors = {
  bg: "#ffffff",
  text: "#1a1a2e",
  textMuted: "#6b7280",
  border: "#e5e7eb",
  headerBg: "#0f0f23",
  headerText: "#ffffff",
  link: "#2563eb",
  severity: {
    CRITICAL: "#dc2626",
    HIGH: "#ea580c",
    MEDIUM: "#ca8a04",
    LOW: "#2563eb",
    NONE: "#6b7280",
  } satisfies Record<SeverityLevel, string>,
};

export const fonts = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export function truncate(text: string, maxLength = 150): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}
