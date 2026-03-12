import type { CveEntry, CuratedCve } from "../data/types.js";

type Annotated = CveEntry & { product: string };

function compareByScoreDesc(a: CveEntry, b: CveEntry): number {
  const scoreDiff = b.cvss.baseScore - a.cvss.baseScore;
  if (scoreDiff !== 0) return scoreDiff;
  return b.published.localeCompare(a.published);
}

export function groupAndSelect(
  annotated: Annotated[],
  cap = 20,
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

  const curated: CuratedCve[] = [];
  for (const [, members] of groups) {
    const sorted = [...members].sort(compareByScoreDesc);
    const [representative, ...related] = sorted;
    curated.push({
      product: representative.product,
      representative,
      related,
    });
  }

  // Sort groups by representative score desc, then cap
  curated.sort((a, b) =>
    compareByScoreDesc(a.representative, b.representative),
  );

  return {
    curated: curated.slice(0, cap),
    totalProductsFound: groups.size,
  };
}
