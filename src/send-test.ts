import "dotenv/config";
import { fetchDigestData } from "./data/fetchFeeds.js";
import { curateCves } from "./curation/index.js";
import { sendDigest } from "./send/postmark.js";
import { config } from "./config.js";

async function main() {
  const cveUrl = process.env.CVE_DATA_URL;
  const kevUrl = process.env.KEV_DATA_URL;
  const postmarkToken = process.env.POSTMARK_SERVER_TOKEN;
  const from = process.env.FROM_EMAIL;
  const recipients = (process.env.RECIPIENTS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (
    !cveUrl ||
    !kevUrl ||
    !postmarkToken ||
    !from ||
    recipients.length === 0
  ) {
    console.error("Missing required env vars. See .env.example");
    process.exit(1);
  }

  console.log("Fetching feeds...");
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
  console.log(`Sending to: ${recipients.join(", ")}`);

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
      products: data.products,
    },
  });

  console.log(`Done! Sent: ${result.sent}, Failed: ${result.failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
