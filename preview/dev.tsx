import "dotenv/config";
import { Blob, File } from "node:buffer";
import { MessageChannel, MessagePort } from "node:worker_threads";
import { ReadableStream, WritableStream, TransformStream } from "node:stream/web";
// Polyfill Web API globals that undici (and the Anthropic SDK) need.
// node:buffer / node:worker_threads / node:stream/web have no global dependencies
// themselves, so these assignments are safe at module load time.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Object.assign(globalThis as any, {
  Blob,
  File,
  MessageChannel,
  MessagePort,
  ReadableStream,
  WritableStream,
  TransformStream,
});

import { DigestEmail } from "../src/email/DigestEmail.js";
import { fetchDigestData } from "../src/data/fetchFeeds.js";
import { curateCves } from "../src/curation/index.js";

export default async function Preview() {
  // Dynamic import ensures undici loads after the globalThis polyfills above are applied.
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
