import "dotenv/config";
import { fetchDigestData } from "./data/fetchFeeds.js";
import { deduplicateByVector } from "./data/deduplicate.js";
import { sendDigest } from "./send/postmark.js";

async function main() {
  const cveUrl = process.env.CVE_DATA_URL;
  const kevUrl = process.env.KEV_DATA_URL;
  const postmarkToken = process.env.POSTMARK_SERVER_TOKEN;
  const from = process.env.FROM_EMAIL;
  const recipients = (process.env.RECIPIENTS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const glyphBaseUrl = process.env.GLYPH_BASE_URL ?? "https://vulnsig.io/api/png";

  if (!cveUrl || !kevUrl || !postmarkToken || !from || recipients.length === 0) {
    console.error("Missing required env vars. See .env.example");
    process.exit(1);
  }

  console.log("Fetching feeds...");
  const data = await fetchDigestData(cveUrl, kevUrl);
  const dedupedCves = deduplicateByVector(data.cves);

  console.log(`CVEs: ${data.cves.length} → ${dedupedCves.length} after dedup`);
  console.log(`KEVs: ${data.kevs.length}`);
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
    props: { date, cves: dedupedCves, kevs: data.kevs, glyphBaseUrl },
  });

  console.log(`Done! Sent: ${result.sent}, Failed: ${result.failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
