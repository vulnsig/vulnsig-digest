# CVE Grouping & Summarization

This document specifies the LLM-powered curation pipeline that replaces naive deduplication (identical CVSS vectors) with product-aware grouping and an editorial summary. It is a component of the vulnsig-digest system.

---

## Overview

Raw CVE feeds typically contain 50–150+ entries per day, many of which affect the same product. Presenting all of them produces a noisy, repetitive digest. This pipeline uses two LLM calls to:

1. **Extract** the primary product name from each CVE description (Sonnet, batched)
2. **Group** CVEs by product and select a representative entry per product
3. **Summarize** the curated set with 1–2 editorial paragraphs (Opus)

The output is a curated list of up to 20 product groups, each with a representative CVE and optional related CVEs, plus a human-readable summary — ready to be rendered into the digest email.

---

## Input

The pipeline receives the full `CveDataset` fetched from the CVE feed:

```typescript
interface CveEntry {
  id: string;
  published: string;
  description: string;
  cvss: {
    version: string;
    vectorString: string;
    baseScore: number;
  };
}

interface CveDataset {
  generatedAt: string;
  windowStart: string;
  windowEnd: string;
  cves: CveEntry[];
}
```

All CVEs in the dataset have a CVSS vector (unscored entries are filtered upstream by the feed poller).

---

## Step 1: Product Name Extraction

### Purpose

Annotate each CVE with a normalized product name so that CVEs affecting the same software can be grouped together.

### Model

`claude-sonnet-4-20250514`

### Batching

CVEs are submitted in chunks of 10. The system prompt is identical across all batches and should be sent with Anthropic's prompt caching (`cache_control: { type: "ephemeral" }`) to minimize cost on subsequent batches.

### System Prompt

```
You are a CVE analyst. For each CVE provided, extract the primary software
product or tool that the vulnerability affects. Return exactly 1–2 words
representing the most commonly recognized name for that product.

Normalize variations to a single canonical name. For example:
- "Apache HTTP Server", "httpd", "Apache httpd 2.4.x" → "Apache httpd"
- "Google Chromium", "Chrome browser" → "Chrome"
- "Microsoft Windows Win32k" → "Windows"
- "OpenSSL libssl" → "OpenSSL"

If the CVE description does not clearly identify a specific product (e.g., it
describes a generic protocol issue or a vulnerability in an unnamed library),
return "Unknown".

Respond with JSON only. No preamble, no markdown fences:
[{ "id": "CVE-2026-XXXXX", "product": "Product Name" }, ...]
```

### User Prompt (per batch)

```
[
  { "id": "CVE-2026-12345", "description": "A buffer overflow in Apache httpd 2.4.59 allows..." },
  { "id": "CVE-2026-12346", "description": "An integer overflow in OpenSSL 3.2.1 allows..." },
  ...
]
```

Only `id` and `description` are sent — the CVSS data is not needed for extraction and omitting it reduces token count.

### Output (per batch)

```json
[
  { "id": "CVE-2026-12345", "product": "Apache httpd" },
  { "id": "CVE-2026-12346", "product": "OpenSSL" }
]
```

### Error Handling

- If a batch call fails, retry once with exponential backoff.
- If the retry fails, the CVEs in that batch are assigned `product: "Unknown"`.
- If the response JSON is malformed, fall back to `"Unknown"` for all entries in that batch.
- If all batches fail entirely, the pipeline falls through to the fallback path (see Fallback section).

### Implementation Notes

- Parse the response with `JSON.parse()` inside a try/catch. Strip markdown fences if present (`json ... `).
- Validate that the returned array length matches the input batch length. If mismatched, attempt to match by `id` field; any unmatched CVEs get `"Unknown"`.
- Batches can be submitted concurrently (up to 3 in parallel) since they are independent. This reduces wall-clock time from ~10–15s sequential to ~3–5s.

---

## Step 2: Group and Select

### Purpose

Collapse the annotated CVE list into product groups, selecting one representative CVE per product.

### Algorithm

```
1. Group all CVEs by their extracted `product` name (case-insensitive).

2. Within each group, select the representative:
   - Primary sort: highest cvss.baseScore
   - Tiebreaker: most recent `published` timestamp
   The remaining CVEs in the group become "related" entries.

3. Sort all product groups by the representative's cvss.baseScore descending.
   Tiebreaker: most recent representative `published` timestamp.

4. Take the top 20 product groups.

5. Within each group, sort related CVEs by cvss.baseScore descending.
```

### Output Types

```typescript
interface CuratedCve {
  product: string; // normalized product name
  representative: CveEntry; // highest-scored CVE for this product
  related: CveEntry[]; // other CVEs for same product, score desc
}

interface CurationResult {
  curated: CuratedCve[]; // up to 20 product groups
  summary: string; // editorial text from Step 3
  totalCvesInFeed: number; // original count before curation
  totalProductsFound: number; // distinct products before top-20 cap
  curatedWithLlm: boolean; // false if fallback was used
}
```

### Edge Cases

- **"Unknown" product group**: If multiple CVEs map to "Unknown", they form a single group. Its representative is selected by the same score/recency rules. This group competes for a top-20 slot like any other.
- **Single-CVE groups**: Many products will have only one CVE. These have an empty `related` array.
- **Fewer than 20 products**: All groups are included.

---

## Step 3: Editorial Summary

### Purpose

Generate a brief, professional summary highlighting the most notable vulnerabilities and patterns of the day. This appears at the top of the digest email.

### Model

`claude-opus-4-6`

### Prompt

**System:**

```
You are the editor of a daily vulnerability digest email called VulnSig Daily.
Your audience is security professionals who scan this email over morning coffee.

Write 1–2 concise paragraphs summarizing today's most notable vulnerabilities.
Highlight:
- The most interesting, novel, or high-impact CVEs
- Any patterns or commonalities (e.g., multiple RCEs in web servers, a cluster
  of auth bypass bugs, several critical scores in a single product category)
- Anything a security team should prioritize acting on

Each CVE in this digest is accompanied by a VulnSig glyph — a small geometric
icon generated from the CVSS vector. When something about the glyphs is
visually notable, you may briefly mention it. For example: "Several of today's
critical entries share nearly identical glyphs, reflecting similar attack
profiles — network-accessible, low-complexity, no authentication required." Or:
"The glyph for the OpenSSL entry stands out with its unusual shape, reflecting
the rare combination of high confidentiality impact with no integrity or
availability impact." Only mention glyphs when there is a genuinely interesting
visual pattern; do not force it.

Tone: professional, direct, no hype. Do not list every CVE — focus on what
matters. Keep it under 150 words.
```

**User:**

```
Today's curated CVEs ({count} products from {totalCvesInFeed} raw entries):

{for each CuratedCve:}
Product: {product}
Representative: {representative.id} (CVSS {representative.cvss.baseScore}, vector: {representative.cvss.vectorString})
Description: {representative.description}
Related CVEs: {related.length} additional
{end for}
```

### Output

1–2 paragraphs of plain text. No markdown formatting, no headers, no bullet points — this goes directly into an email as body text.

### Error Handling

- If the Opus call fails, retry once.
- If the retry fails, the digest sends without a summary. The `summary` field in `CurationResult` is set to an empty string, and the email template omits the summary section.

---

## Fallback Path

If the Anthropic API is entirely unavailable (all extraction batches fail), the pipeline falls back to a non-LLM curation strategy:

1. Remove CVEs with identical `cvss.vectorString` values, keeping only the most recent by `published` timestamp.
2. Sort remaining CVEs by `cvss.baseScore` descending. Tiebreaker: most recent `published`.
3. Take the top 20.
4. Each becomes its own `CuratedCve` with `product: "—"` and an empty `related` array.
5. `summary` is set to empty string.
6. `curatedWithLlm` is set to `false`.

The email template checks `curatedWithLlm` and, if false, displays a small note: _"Today's digest is unedited — automated curation was unavailable."_

---

## Cost Estimate

| Step               | Model  | Input                       | Calls/day    | Est. cost/day   |
| ------------------ | ------ | --------------------------- | ------------ | --------------- |
| Product extraction | Sonnet | ~10 CVEs × ~200 tokens each | 5–15 batches | $0.01–0.05      |
| Editorial summary  | Opus   | ~20 CVEs × ~250 tokens each | 1            | $0.05–0.10      |
| **Total**          |        |                             |              | **~$0.10–0.15** |

Prompt caching on the extraction system prompt reduces Sonnet input costs by ~90% on batches 2+. The Opus call is a single invocation with moderate input.

---

## Module Structure

```
src/curation/
├── extractProducts.ts     # Step 1: batch Sonnet calls, JSON parsing, retry logic
├── groupAndSelect.ts      # Step 2: grouping, representative selection, top-20 cap
├── generateSummary.ts     # Step 3: Opus call, prompt construction
├── prompts.ts             # System and user prompt templates (shared constants)
├── fallback.ts            # Vector-dedup fallback for API failure
└── index.ts               # Pipeline orchestrator: runs steps 1→2→3 with fallback
```

### Pipeline Orchestrator (`index.ts`)

```typescript
import { extractProducts } from "./extractProducts";
import { groupAndSelect } from "./groupAndSelect";
import { generateSummary } from "./generateSummary";
import { fallbackCuration } from "./fallback";
import type { CveEntry, CurationResult } from "../data/types";

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
  const { curated, totalProductsFound } = groupAndSelect(annotated, 20);

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
```

---

## Testing

### Unit Tests (`curation.test.ts`)

**groupAndSelect**:

- Groups CVEs with identical product names correctly
- Selects highest score as representative
- Breaks ties by most recent published date
- Caps at 20 groups
- Sorts groups by representative score descending
- Handles "Unknown" product as a normal group
- Handles single-CVE groups (empty related array)

**extractProducts** (with mocked API):

- Parses valid JSON response correctly
- Handles markdown-fenced JSON (`\`\`\`json ... \`\`\``)
- Falls back to "Unknown" on malformed response
- Retries once on API failure
- Matches response to input by id when array length mismatches

**fallbackCuration**:

- Deduplicates by identical vectorString
- Keeps most recent when deduplicating
- Returns top 20 by score
- Sets curatedWithLlm to false

### Integration Test

`npm run send-test` exercises the full pipeline against live data and the real Anthropic API, verifying that the email renders and sends successfully.
