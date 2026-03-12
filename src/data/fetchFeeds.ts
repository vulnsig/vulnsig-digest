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

/** Select the N most recently published entries. */
export function selectRecent(entries: CveEntry[], count: number): CveEntry[] {
  return [...entries]
    .sort(
      (a, b) =>
        new Date(b.published).getTime() - new Date(a.published).getTime(),
    )
    .slice(0, count);
}

export interface DigestData {
  cves: CveEntry[];
  kevs: CveEntry[];
  generatedAt: string;
}

export async function fetchDigestData(
  cveUrl: string,
  kevUrl: string,
): Promise<DigestData> {
  const [cveFeed, kevFeed] = await Promise.all([
    fetchFeed(cveUrl),
    fetchFeed(kevUrl),
  ]);

  return {
    cves: selectRecent(cveFeed.cves, 20),
    kevs: selectRecent(kevFeed.cves, 5),
    generatedAt: cveFeed.generatedAt,
  };
}
