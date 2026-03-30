import type { ScheduledEvent } from "aws-lambda";
import { render } from "@react-email/render";
import { fetchDigestData } from "./data/fetchFeeds.js";
import { curateCves } from "./curation/index.js";
import { DigestEmail } from "./email/DigestEmail.js";
import { sendDigest } from "./send/postmark.js";
import { publishLatestDigest } from "./publish/s3.js";
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
  const subscribersUrl = requireEnv("SUBSCRIBERS_API_URL"); // includes trailing slash
  const apiSecret = requireEnv("API_SECRET");

  console.log("Fetching subscribers...");
  const subscribersResp = await fetch(`${subscribersUrl}subscribers`, {
    headers: { "x-api-key": apiSecret },
  });
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
  const curation = await curateCves(data.cves, data.products, data.prevSummary);
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

  console.log("Rendering email...");
  const html = await render(
    DigestEmail({
      date,
      curation,
      kevs: data.kevs,
      glyphBaseUrl: config.glyphBaseUrl,
      kevWindowDays: config.kevWindowDays,
      products: data.products,
    }),
  );
  const subject = `VulnSig Digest: ${date}`;

  const digestBucket = requireEnv("DIGEST_S3_BUCKET");
  const [result] = await Promise.all([
    sendDigest({ postmarkToken, from, subscribers, subject, html }),
    publishLatestDigest(digestBucket, html, curation.summary),
  ]);

  console.log(`Sent: ${result.sent}/${result.total}, Failed: ${result.failed}`);
}
