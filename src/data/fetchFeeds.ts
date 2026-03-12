import type { CveDataset, CveEntry } from "./types.js";

export async function fetchFeed(url: string): Promise<CveDataset> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch feed from ${url}: ${res.status} ${res.statusText}`,
    );
  }
  return (await res.json()) as CveDataset;
}

/** Returns all entries published at or after `cutoff`. */
export function selectWithinWindow(
  entries: CveEntry[],
  cutoff: Date,
): CveEntry[] {
  return entries.filter((e) => new Date(e.published) >= cutoff);
}

export interface DigestData {
  cves: CveEntry[];
  kevs: CveEntry[];
  generatedAt: string;
}

export async function fetchDigestData(
  cveUrl: string,
  kevUrl: string,
  cveWindowHours = 24,
  kevWindowDays = 7,
): Promise<DigestData> {
  const [cveFeed, kevFeed] = await Promise.all([
    fetchFeed(cveUrl),
    fetchFeed(kevUrl),
  ]);

  const now = Date.now();
  const cveCutoff = new Date(now - cveWindowHours * 60 * 60 * 1000);
  const kevCutoff = new Date(now - kevWindowDays * 24 * 60 * 60 * 1000);

  return {
    cves: selectWithinWindow(cveFeed.cves, cveCutoff),
    kevs: selectWithinWindow(kevFeed.cves, kevCutoff),
    generatedAt: cveFeed.generatedAt,
  };
}
