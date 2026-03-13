import { DigestEmail } from "../src/email/DigestEmail.js";
import type { DigestSnapshot } from "../src/data/types.js";
import snapshot from "./snapshot.json";

// preview/dev.tsx reads a pre-built snapshot produced by:
//   npm run curate-debug
// This avoids importing @anthropic-ai/sdk, undici, etc. which
// react-email's esbuild cannot bundle.

const { date, curation, kevs } = snapshot as DigestSnapshot;

export default function Preview() {
  return (
    <DigestEmail
      date={date}
      curation={curation}
      kevs={kevs}
      glyphBaseUrl="https://vulnsig.io/api/png"
    />
  );
}
