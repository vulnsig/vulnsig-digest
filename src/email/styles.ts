import { scoreToHue } from "vulnsig";
import type { SeverityLevel } from "../data/types.js";

export { scoreToHue };

export function scoreBadgeBg(score: number): string {
  const { hue, sat, light } = scoreToHue(score);
  return `hsl(${hue}, ${sat}%, ${52 * light}%)`;
}

export function scoreBadgeTextColor(score: number): string {
  const { light } = scoreToHue(score);
  return 52 * light > 50 ? "#000000" : "#ffffff";
}

// Zinc dark palette — mirrors vulnsig-www
export const colors = {
  body: "#09090b", // zinc-950
  bg: "#18181b", // zinc-900
  bgMuted: "#27272a", // zinc-800
  text: "#d4d4d8", // zinc-300
  textMuted: "#71717a", // zinc-500
  border: "#27272a", // zinc-800
  headerBg: "#09090b", // zinc-950
  headerText: "#d4d4d8",
  link: "#a1a1aa", // zinc-400
  // Kept for KEV heading — categorical severity is still useful in email
  severity: {
    CRITICAL: "#dc2626",
    HIGH: "#ea580c",
    MEDIUM: "#ca8a04",
    LOW: "#3b82f6",
    NONE: "#71717a",
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

export function truncate(text: string, maxLength = 400): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}
