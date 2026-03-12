import type { CveEntry, CurationResult } from "../data/types.js";

export function fallbackCuration(cves: CveEntry[]): CurationResult {
  const totalCvesInFeed = cves.length;

  // Keep most recent entry per unique vector
  const byVector = new Map<string, CveEntry>();
  for (const cve of cves) {
    const existing = byVector.get(cve.cvss.vectorString);
    if (!existing || cve.published > existing.published) {
      byVector.set(cve.cvss.vectorString, cve);
    }
  }

  const deduped = [...byVector.values()].sort((a, b) => {
    const scoreDiff = b.cvss.baseScore - a.cvss.baseScore;
    if (scoreDiff !== 0) return scoreDiff;
    return b.published.localeCompare(a.published);
  });

  const curated = deduped.slice(0, 20).map((cve) => ({
    product: "—",
    representative: cve,
    related: [],
  }));

  return {
    curated,
    summary: "",
    totalCvesInFeed,
    totalProductsFound: byVector.size,
    curatedWithLlm: false,
  };
}
