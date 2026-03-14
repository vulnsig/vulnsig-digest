import { extractProducts } from "./extractProducts.js";
import { groupAndSelect } from "./groupAndSelect.js";
import { generateSummary } from "./generateSummary.js";
import { fallbackCuration } from "./fallback.js";
import { config } from "../config.js";
import type { CveEntry, CurationResult } from "../data/types.js";

export async function curateCves(cves: CveEntry[]): Promise<CurationResult> {
  const totalCvesInFeed = cves.length;

  // Step 1: Extract product names
  let annotated: Array<CveEntry & { product: string }>;
  try {
    annotated = await extractProducts(cves);
  } catch (err) {
    console.error("Product extraction failed entirely, using fallback:", err);
    return fallbackCuration(cves);
  }

  // Step 2: Group and select top 20
  const { curated, totalProductsFound } = groupAndSelect(
    annotated,
    config.curation.cap,
    config.curation.diversityCap,
  );

  // Step 3: Generate editorial summary
  let summary = "";
  try {
    summary = await generateSummary(curated, totalCvesInFeed);
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
