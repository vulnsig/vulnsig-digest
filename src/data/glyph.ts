import type { CveEntry } from "./types.js";

export function glyphUrl(
  entry: CveEntry,
  baseUrl: string,
  size = 128,
  density = 72,
): string {
  const params = new URLSearchParams({
    vector: entry.cvss.vectorString,
    score: String(entry.cvss.baseScore),
    size: String(size),
    density: String(density),
  });
  return `${baseUrl}?${params.toString()}`;
}
