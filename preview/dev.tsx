import "dotenv/config";
import { DigestEmail } from "../src/email/DigestEmail.js";
import { fetchDigestData } from "../src/data/fetchFeeds.js";
import { curateCves } from "../src/curation/index.js";

export default async function Preview() {
  const cveUrl = process.env.CVE_DATA_URL!;
  const kevUrl = process.env.KEV_DATA_URL!;
  const glyphBaseUrl =
    process.env.GLYPH_BASE_URL ?? "https://vulnsig.io/api/png";
  const cveWindowHours = parseInt(process.env.CVE_WINDOW_HOURS ?? "24", 10);
  const kevWindowDays = parseInt(process.env.KEV_WINDOW_DAYS ?? "7", 10);

  const data = await fetchDigestData(
    cveUrl,
    kevUrl,
    cveWindowHours,
    kevWindowDays,
  );
  const curation = await curateCves(data.cves);

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <DigestEmail
      date={date}
      curation={curation}
      kevs={data.kevs}
      glyphBaseUrl={glyphBaseUrl}
    />
  );
}
