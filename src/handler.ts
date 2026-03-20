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
  const from = requireEnv("DIGEST_FROM_EMAIL");
  const subscribersUrl = requireEnv("SUBSCRIBERS_API_URL");

  console.log("Fetching subscribers...");
  const subscribersResp = await fetch(`${subscribersUrl}subscribers`);
  if (!subscribersResp.ok) {
    throw new Error(`Failed to fetch subscribers: ${subscribersResp.status}`);
  }
  const subscribers: Array<{ email: string; unsubscribeToken: string }> =
    await subscribersResp.json();
  if (subscribers.length === 0) {
    console.warn("No confirmed subscribers, skipping send");
    return;
  }
  console.log(`Found ${subscribers.length} subscriber(s)`);

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
    subscribers,
    unsubscribeBaseUrl: subscribersUrl,
    props: {
      date,
      curation,
      kevs: data.kevs,
      glyphBaseUrl: config.glyphBaseUrl,
      kevWindowDays: config.kevWindowDays,
      products: data.products,
    },
  });

  console.log(`Sent: ${result.sent}/${result.total}, Failed: ${result.failed}`);
}
