import { DigestEmail } from "../src/email/DigestEmail.js";
import sampleCves from "../test/fixtures/sample-cves.json";
import sampleKevs from "../test/fixtures/sample-kevs.json";
import type { CveEntry } from "../src/data/types.js";

export default function Preview() {
  return (
    <DigestEmail
      date="Tuesday, March 11, 2026"
      cves={sampleCves.cves as CveEntry[]}
      kevs={sampleKevs.cves as CveEntry[]}
      glyphBaseUrl="https://vulnsig.io/api/png"
    />
  );
}
