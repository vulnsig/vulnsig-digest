import type { CveEntry } from "./types.js";

/**
 * Remove CVEs with identical CVSS vector strings, keeping only
 * the first (most recent) occurrence. Entries should be pre-sorted
 * by published date descending.
 */
export function deduplicateByVector(entries: CveEntry[]): CveEntry[] {
  const seen = new Set<string>();
  const result: CveEntry[] = [];

  for (const entry of entries) {
    const vector = entry.cvss.vectorString;
    if (!seen.has(vector)) {
      seen.add(vector);
      result.push(entry);
    }
  }

  return result;
}
