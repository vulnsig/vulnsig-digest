import "dotenv/config";
import { Blob, File } from "node:buffer";
// Set Blob and File synchronously at module load (safe — node:buffer requires no globals).
// FormData and fetch are set inside Preview via dynamic import, which runs after
// this assignment and thus after undici's own Blob/File dependency is satisfied.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Object.assign(globalThis as any, { Blob, File });

import { DigestEmail } from "../src/email/DigestEmail.js";
import { fetchDigestData } from "../src/data/fetchFeeds.js";
import { curateCves } from "../src/curation/index.js";

export default async function Preview() {
  // Dynamic import ensures undici loads after globalThis.Blob is set above.
  const { FormData, fetch } = await import("undici");
  Object.assign(globalThis, { FormData, fetch });

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
