import { groupAndSelect } from "./groupAndSelect.js";
import { generateSummary } from "./generateSummary.js";
import { fallbackCuration } from "./fallback.js";
import { config } from "../config.js";
import type { CveEntry, CurationResult, ProductInfo } from "../data/types.js";

export async function curateCves(
  cves: CveEntry[],
  products: Record<string, ProductInfo>,
  prevSummary = "",
): Promise<CurationResult> {
  const totalCvesInFeed = cves.length;

  // Annotate CVEs with product names from the feed
  const annotated = cves.map((cve) => ({
    ...cve,
    product: products[cve.id]?.product ?? "Unknown",
  }));

  if (annotated.every((a) => a.product === "Unknown")) {
    console.warn("No product mappings found, using fallback");
    return fallbackCuration(cves);
  }

  // Group and select
  const { curated, totalProductsFound } = groupAndSelect(
    annotated,
    config.curation.cap,
    config.curation.diversityCap,
  );

  // Generate editorial summary
  let summary = "";
  try {
    summary = await generateSummary(curated, totalCvesInFeed, prevSummary);
  } catch (err) {
    console.error("Summary generation failed, sending without summary:", err);
  }

  return {
    curated,
    summary,
    totalCvesInFeed,
    totalProductsFound,
    curatedWithLlm: true,
  };
}
