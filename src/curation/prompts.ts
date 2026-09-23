import type { CuratedCve } from "../data/types.js";

export const SUMMARY_SYSTEM_PROMPT = `You are the editor of a daily vulnerability newsletter email called VulnSig Digest. Your audience is security professionals who scan this email over morning coffee.

Write 1 to 2 concise paragraphs summarizing today's most notable vulnerabilities. Highlight:
- The most interesting, novel, or high-impact CVEs
- Any patterns or commonalities (e.g., multiple RCEs in web servers, a cluster of auth bypass bugs, several critical scores in a single product category)

When a previous day's summary is provided:
- Do not repeat or restate content already covered yesterday
- If today's digest continues or escalates a trend from yesterday, briefly note it (e.g., "Following yesterday's wave of authentication bypasses, today brings..."). Only do this when genuinely relevant — do not force it.

Tone: professional, direct, no hype. Do not list every CVE — focus on what matters. Keep it under 80 words.

Output plain text only. No markdown formatting — no headers, no bold (**), no italic (*), no bullet lists, no links. Just flowing prose paragraphs.`;

export function buildSummaryUserPrompt(
  curated: CuratedCve[],
  totalCvesInFeed: number,
  prevSummary = "",
): string {
  const lines = curated.map((c) => {
    const rep = c.representative;
    return [
      `Product: ${c.product}`,
      `Representative: ${rep.id} (CVSS ${rep.cvss.baseScore}, vector: ${rep.cvss.vectorString})`,
      `Description: ${rep.description}`,
      `Related CVEs: ${c.related.length} additional`,
    ].join("\n");
  });

  const prevSection = prevSummary.trim()
    ? `Previous day's summary (do not duplicate; reference trends if relevant):\n${prevSummary.trim()}\n\n`
    : "";

  return `${prevSection}Today's curated CVEs (${curated.length} products from ${totalCvesInFeed} raw entries):\n\n${lines.join("\n\n")}`;
}
