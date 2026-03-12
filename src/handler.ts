import type { ScheduledEvent } from "aws-lambda";
import { fetchDigestData } from "./data/fetchFeeds.js";
import { deduplicateByVector } from "./data/deduplicate.js";
import { sendDigest } from "./send/postmark.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export async function handler(_event: ScheduledEvent): Promise<void> {
  const cveUrl = requireEnv("CVE_DATA_URL");
  const kevUrl = requireEnv("KEV_DATA_URL");
  const postmarkToken = requireEnv("POSTMARK_SERVER_TOKEN");
  const from = requireEnv("FROM_EMAIL");
  const recipients = requireEnv("RECIPIENTS").split(",").map((s) => s.trim()).filter(Boolean);
  const glyphBaseUrl = requireEnv("GLYPH_BASE_URL");

  if (recipients.length === 0) {
    console.warn("No recipients configured, skipping send");
    return;
  }

  console.log("Fetching CVE and KEV feeds...");
  const data = await fetchDigestData(cveUrl, kevUrl);

  const dedupedCves = deduplicateByVector(data.cves);
  console.log(`CVEs: ${data.cves.length} raw → ${dedupedCves.length} after dedup`);
  console.log(`KEVs: ${data.kevs.length}`);

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const result = await sendDigest({
    postmarkToken,
    from,
    recipients,
    props: { date, cves: dedupedCves, kevs: data.kevs, glyphBaseUrl },
  });

  console.log(`Sent: ${result.sent}/${result.total}, Failed: ${result.failed}`);
}
