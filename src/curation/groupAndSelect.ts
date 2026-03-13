import type { CveEntry, CuratedCve } from "../data/types.js";

type Annotated = CveEntry & { product: string };

function compareByScoreDesc(a: CveEntry, b: CveEntry): number {
  const scoreDiff = b.cvss.baseScore - a.cvss.baseScore;
  if (scoreDiff !== 0) return scoreDiff;
  return b.published.localeCompare(a.published);
}

export function groupAndSelect(
  annotated: Annotated[],
  cap = 15,
  diversityCap = 15,
): { curated: CuratedCve[]; totalProductsFound: number } {
  // Group by normalized (lowercase) product name
  const groups = new Map<string, Annotated[]>();
  for (const cve of annotated) {
    const key = cve.product.toLowerCase();
    const group = groups.get(key);
    if (group) {
      group.push(cve);
    } else {
      groups.set(key, [cve]);
    }
  }

  const allGroups: CuratedCve[] = [];
  for (const [, members] of groups) {
    const sorted = [...members].sort(compareByScoreDesc);
    const [representative, ...related] = sorted;
    allGroups.push({
      product: representative.product,
      representative,
      related,
    });
  }

  // Sort groups by representative score desc, then take top `cap`
  allGroups.sort((a, b) =>
    compareByScoreDesc(a.representative, b.representative),
  );

  const topGroups = allGroups.slice(0, cap);

  // Collect vectors already represented in the top groups
  const seenVectors = new Set<string>();
  for (const g of topGroups) {
    seenVectors.add(g.representative.cvss.vectorString);
    for (const r of g.related) {
      seenVectors.add(r.cvss.vectorString);
    }
  }

  // Fill diversity slots from remaining groups whose representative
  // vector is not yet seen — gives the digest visual variety
  const diversityPicks: CuratedCve[] = [];
  for (const g of allGroups.slice(cap)) {
    if (diversityPicks.length >= diversityCap) break;
    if (!seenVectors.has(g.representative.cvss.vectorString)) {
      diversityPicks.push(g);
      seenVectors.add(g.representative.cvss.vectorString);
    }
  }

  // Merge and sort all selected groups by published date (most recent first)
  const combined = [...topGroups, ...diversityPicks];
  combined.sort((a, b) =>
    b.representative.published.localeCompare(a.representative.published),
  );

  return {
    curated: combined,
    totalProductsFound: groups.size,
  };
}
