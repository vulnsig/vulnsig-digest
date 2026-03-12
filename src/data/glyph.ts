import type { CveEntry } from "./types.js";

export function glyphUrl(entry: CveEntry, baseUrl: string, size = 128): string {
  const params = new URLSearchParams({
    vector: entry.cvss.vectorString,
    score: String(entry.cvss.baseScore),
    size: String(size),
  });
  return `${baseUrl}?${params.toString()}`;
}
