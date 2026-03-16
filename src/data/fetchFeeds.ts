import type { CveDataset, CveEntry, ProductInfo } from "./types.js";
import { config } from "../config.js";

export async function fetchFeed(url: string): Promise<CveDataset> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch feed from ${url}: ${res.status} ${res.statusText}`,
    );
  }
  return (await res.json()) as CveDataset;
}

/** Returns entries published at or after `cutoff`, most recent first, capped at `maxCount`. */
export function selectWithinWindow(
  entries: CveEntry[],
  cutoff: Date,
  maxCount?: number,
): CveEntry[] {
  const filtered = entries
    .filter((e) => new Date(e.published) >= cutoff)
    .sort((a, b) => b.published.localeCompare(a.published));
  return maxCount ? filtered.slice(0, maxCount) : filtered;
}

export interface DigestData {
  cves: CveEntry[];
  kevs: CveEntry[];
  products: Record<string, ProductInfo>;
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

  console.debug("kevFeed.products:", JSON.stringify(kevFeed.products, null, 2));

  const now = Date.now();
  const cveCutoff = new Date(now - cveWindowHours * 60 * 60 * 1000);
  const kevCutoff = new Date(now - kevWindowDays * 24 * 60 * 60 * 1000);

  return {
    cves: selectWithinWindow(cveFeed.cves, cveCutoff, config.cveMaxCount),
    kevs: selectWithinWindow(kevFeed.cves, kevCutoff, config.kevMaxCount),
    products: { ...kevFeed.products, ...cveFeed.products }, // CVE might overite KEV
    generatedAt: cveFeed.generatedAt,
  };
}
