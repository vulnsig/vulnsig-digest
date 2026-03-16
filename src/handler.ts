import type { ScheduledEvent } from "aws-lambda";
import { fetchDigestData } from "./data/fetchFeeds.js";
import { curateCves } from "./curation/index.js";
import { sendDigest } from "./send/postmark.js";
import { config } from "./config.js";

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
  const recipients = requireEnv("RECIPIENTS")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (recipients.length === 0) {
    console.warn("No recipients configured, skipping send");
    return;
  }

  console.log("Fetching CVE and KEV feeds...");
  const data = await fetchDigestData(
    cveUrl,
    kevUrl,
    config.cveWindowHours,
    config.kevWindowDays,
  );
  console.log(`CVEs: ${data.cves.length} raw, KEVs: ${data.kevs.length}`);

  console.log("Curating CVEs...");
  const curation = await curateCves(data.cves, data.products);
  console.log(
    `Curated: ${curation.curated.length} products from ${curation.totalProductsFound} found` +
      (curation.curatedWithLlm ? "" : " (fallback)"),
  );

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
    props: {
      date,
      curation,
      kevs: data.kevs,
      glyphBaseUrl: config.glyphBaseUrl,
      kevWindowDays: config.kevWindowDays,
    },
  });

  console.log(`Sent: ${result.sent}/${result.total}, Failed: ${result.failed}`);
}
