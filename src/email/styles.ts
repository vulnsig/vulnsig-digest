import { scoreToHue } from "vulnsig";

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
  zinc950: "#09090b",
  zinc900: "#18181b",
  zinc800: "#27272a",
  zinc700: "#3f3f46",
  zinc600: "#52525b",
  zinc500: "#71717a",
  zinc400: "#a1a1aa",
  zinc300: "#d4d4d8",
  gray500: "#6b7280",
  gray400: "#9ca3af",
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

export function truncate(text: string, maxLength = 300): string {
  if (text.length <= maxLength) return text;
  const lastSpace = text.lastIndexOf(" ", maxLength);
  const breakAt = lastSpace > 0 ? lastSpace : maxLength;
  return text.slice(0, breakAt).trimEnd() + "...";
}
