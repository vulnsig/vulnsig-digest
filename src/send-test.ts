import "dotenv/config";
import { fetchDigestData } from "./data/fetchFeeds.js";
import { curateCves } from "./curation/index.js";
import { sendDigest } from "./send/postmark.js";

async function main() {
  const cveUrl = process.env.CVE_DATA_URL;
  const kevUrl = process.env.KEV_DATA_URL;
  const postmarkToken = process.env.POSTMARK_SERVER_TOKEN;
  const from = process.env.FROM_EMAIL;
  const recipients = (process.env.RECIPIENTS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const glyphBaseUrl =
    process.env.GLYPH_BASE_URL ?? "https://vulnsig.io/api/png";

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

  const cveWindowHours = parseInt(process.env.CVE_WINDOW_HOURS ?? "24", 10);
  const kevWindowDays = parseInt(process.env.KEV_WINDOW_DAYS ?? "7", 10);

  console.log("Fetching feeds...");
  const data = await fetchDigestData(
    cveUrl,
    kevUrl,
    cveWindowHours,
    kevWindowDays,
  );
  console.log(`CVEs: ${data.cves.length} raw, KEVs: ${data.kevs.length}`);

  console.log("Curating CVEs...");
  const curation = await curateCves(data.cves);
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
    props: { date, curation, kevs: data.kevs, glyphBaseUrl, kevWindowDays },
  });

  console.log(`Done! Sent: ${result.sent}, Failed: ${result.failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
