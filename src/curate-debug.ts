import "dotenv/config";
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchDigestData } from "./data/fetchFeeds.js";
import { groupAndSelect } from "./curation/groupAndSelect.js";
import { generateSummary } from "./curation/generateSummary.js";
import { config } from "./config.js";
import type { DigestSnapshot } from "./data/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const cveUrl = process.env.CVE_DATA_URL!;
const kevUrl = process.env.KEV_DATA_URL!;

console.log("━━━ Step 0: Fetch ━━━");
const data = await fetchDigestData(
  cveUrl,
  kevUrl,
  config.cveWindowHours,
  config.kevWindowDays,
);
console.log(`  CVEs in window: ${data.cves.length}`);
console.log(`  KEVs in window: ${data.kevs.length}`);

console.log("\n━━━ Step 1: Annotate products ━━━");
const annotated = data.cves.map((cve) => ({
  ...cve,
  product: data.products[cve.id]?.product ?? "Unknown",
}));
const unknownCount = annotated.filter((e) => e.product === "Unknown").length;
console.log(`  Unknown: ${unknownCount}/${annotated.length}`);
console.log("  Annotations:");
for (const e of annotated) {
  console.log(`    ${e.id}  →  ${e.product}`);
}

console.log("\n━━━ Step 2: Group and select ━━━");
const { curated, totalProductsFound } = groupAndSelect(
  annotated,
  config.curation.cap,
  config.curation.diversityCap,
);
console.log(
  `  Distinct products: ${totalProductsFound}  →  top ${curated.length} shown`,
);
console.log("  Groups:");
for (const g of curated) {
  const rel =
    g.related.length > 0
      ? `  (+${g.related.length} related: ${g.related.map((r) => r.id).join(", ")})`
      : "";
  console.log(
    `    [${g.representative.cvss.baseScore.toFixed(1)}] ${g.product}  —  ${g.representative.id}${rel}`,
  );
}

console.log("\n━━━ Step 3: Summary ━━━");
const summary = await generateSummary(curated, data.cves.length);
console.log(summary);

// Write snapshot for preview/dev.tsx
const snapshot: DigestSnapshot = {
  date: new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
  curation: {
    curated,
    summary,
    totalCvesInFeed: data.cves.length,
    totalProductsFound,
    curatedWithLlm: true,
  },
  kevs: data.kevs,
  kevWindowDays: config.kevWindowDays,
  products: data.products,
};

const outPath = resolve(__dirname, "../preview/snapshot.json");
writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + "\n");
console.log(`\n✔ Snapshot written to ${outPath}`);
