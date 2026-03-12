# vulnsig-digest — Specification

## Purpose

A daily email digest delivering recent CVE publications and KEV additions to subscribers, each accompanied by its VulnSig glyph. The digest provides a quick visual + textual summary of the vulnerability landscape from the last 24 hours.

---

## Architecture Overview

```
                          ┌──────────────────┐
                          │  EventBridge      │
                          │  (daily schedule) │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  Lambda           │
                          │  vulnsig-digest   │
                          └──┬─────┬─────┬───┘
                             │     │     │
                    ┌────────┘     │     └────────┐
                    ▼              ▼              ▼
            ┌─────────────┐ ┌──────────┐  ┌───────────┐
            │ S3 (public)  │ │ Postmark │  │ vulnsig.io│
            │ CVE + KEV    │ │ SMTP API │  │ /glyph/   │
            │ JSON feeds   │ └──────────┘  │ PNG endpoint│
            └─────────────┘                └───────────┘
```

The Lambda runs once daily, reads the same normalized JSON feeds that power vulnsig.io, renders an email with React Email, and sends it via Postmark.

---

## Data Sources

### CVE Feed

- **URL**: Provided via `CVE_DATA_URL` env var (same value as `NEXT_PUBLIC_CVE_DATA_URL` used by vulnsig-www)
- **Format**: `CveDataset` — JSON object with shape:

  ```typescript
  interface CveEntry {
    id: string; // "CVE-2026-XXXXX"
    published: string; // ISO timestamp
    description: string; // English description text
    cvss: {
      version: string; // "3.1" | "4.0"
      vectorString: string; // "CVSS:3.1/AV:N/AC:L/..."
      baseScore: number; // 9.8
    };
  }

  interface CveDataset {
    generatedAt: string; // ISO timestamp
    windowStart: string; // ISO timestamp
    windowEnd: string; // ISO timestamp
    cves: CveEntry[];
  }
  ```

- **Selection**: Take the 20 most recent CVEs by `published` date
- **Deduplication**: Remove CVEs with identical `cvss.vectorString` values, keeping only the first (most recent) occurrence. This prevents the digest from being dominated by batches of identically-scored vulnerabilities.

### KEV Feed

- **URL**: Provided via `KEV_DATA_URL` env var (same value as `NEXT_PUBLIC_KEV_DATA_URL` used by vulnsig-www)
- **Format**: `CveDataset` — identical shape to the CVE feed. KEV entries are already enriched with CVSS vectors by the vulnsig-deploy KEV poller, so each entry has the same `CveEntry` structure (id, published, description, cvss).
- **Selection**: Take the 5 most recently added KEV entries by `published` date

**Note**: Both feeds share the `CveDataset` / `CveEntry` interfaces. The digest code can use a single type definition for both.

### Product Deduplication (Future)

The current deduplication strategy (identical CVSS vectors) is a rough proxy. A future improvement should deduplicate CVEs affecting the same product. This likely requires:

- Parsing CPE data from the CVE feed (if available) or the `description` field
- Grouping by vendor + product and selecting one representative CVE per product
- This is explicitly **out of scope for MVP** but the data pipeline should be structured to make this filter easy to add.

---

## Glyph Rendering

Each CVE and KEV entry in the email includes its VulnSig glyph as a PNG image.

- **Endpoint**: `https://vulnsig.io/api/png` (already exists in vulnsig-www)
- **Parameters**:
  - `vector` (required) — URL-encoded CVSS vector string
  - `score` (required) — numeric base score
  - `size` (optional) — pixel dimensions, default TBD (use a higher value for email, e.g. 128 or 256)
  - `density` (optional) — pixel density multiplier for retina
- **Example URL**:
  ```
  https://vulnsig.io/api/png?vector=CVSS%3A3.1%2FAV%3AN%2FAC%3AH%2FPR%3AN%2FUI%3AN%2FS%3AU%2FC%3AH%2FI%3AH%2FA%3AN&score=7.4&size=128
  ```
- **In email**: Referenced via `<img>` tag pointing to the URL, displayed at 64×64 CSS pixels (with higher-res source for retina)
- **Alt text**: `"VulnSig glyph for {CVE-ID} — CVSS {baseScore}"`
- **Fallback**: If the glyph endpoint is unavailable, the email still renders with alt text and a colored severity badge
- **Caching**: Responses should include `Cache-Control: public, max-age=31536000, immutable` since a given vector + score always produces the same glyph

### Glyph URL Construction

The digest builds glyph URLs with a helper like:

```typescript
function glyphUrl(entry: CveEntry, baseUrl: string, size = 128): string {
  const params = new URLSearchParams({
    vector: entry.cvss.vectorString,
    score: String(entry.cvss.baseScore),
    size: String(size),
  });
  return `${baseUrl}?${params.toString()}`;
}
```

---

## Email Rendering

### Technology

- **React Email** for template authoring
- Templates compile to email-safe HTML at send time within the Lambda

### Template Structure

```
┌─────────────────────────────────────────────┐
│  VulnSig Daily Digest — {date}              │
│  vulnsig.io                                 │
├─────────────────────────────────────────────┤
│                                             │
│  🔴 KNOWN EXPLOITED VULNERABILITIES (KEV)   │
│  Recently added to CISA KEV catalog         │
│                                             │
│  ┌─────┬──────────────────────────────────┐ │
│  │glyph│ CVE-2026-XXXXX  [CRITICAL 9.8]  │ │
│  │ png │ Description text, truncated to   │ │
│  │     │ ~150 chars...                    │ │
│  └─────┴──────────────────────────────────┘ │
│  ... (up to 5 KEV entries)                  │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  📋 RECENT CVEs                             │
│  New vulnerabilities published in last 24h  │
│                                             │
│  ┌─────┬──────────────────────────────────┐ │
│  │glyph│ CVE-2026-XXXXX  [HIGH 8.1]      │ │
│  │ png │ Brief description text,          │ │
│  │     │ truncated to ~150 chars...       │ │
│  └─────┴──────────────────────────────────┘ │
│  ... (up to 20 CVE entries)                 │
│                                             │
├─────────────────────────────────────────────┤
│  View all vulnerabilities at vulnsig.io     │
│  Unsubscribe                                │
└─────────────────────────────────────────────┘
```

### Styling

- Clean, professional, dark-on-light
- Severity color coding consistent with vulnsig.io (CRITICAL=red, HIGH=orange, MEDIUM=yellow, LOW=green/blue)
- VulnSig brand colors and logo in header
- Descriptions truncated to ~150 characters with "..." to keep the email scannable
- Monospace font for CVE IDs and vector strings

### Email Metadata

- **From**: `VulnSig Daily Digest <digest@digest.vulnsig.io>`
- **Subject**: `VulnSig Daily — {count} new CVEs, {kev_count} KEV additions — {date}`
- **Headers**:
  - `List-Unsubscribe: <https://api.vulnsig.io/unsubscribe?token={token}>`
  - `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
- **Plain text version**: Auto-generated or manually authored alternative with CVE IDs, scores, and truncated descriptions (no images)

---

## Sending

### Service

- **Postmark** via their Node.js SDK or HTTP API
- Use a dedicated **Broadcast** message stream (not Transactional) — Postmark separates these for deliverability

### Configuration

- `POSTMARK_SERVER_TOKEN` env var for API authentication
- `FROM_EMAIL` env var for sender address
- Postmark requires domain verification (DKIM + Return-Path) — set up DNS records on `digest.vulnsig.io`

### Where Sending Logic Lives

The Postmark API call lives **in this repo** (`vulnsig-digest`), not in vulnsig-deploy. The Lambda handler in this repo is responsible for the full pipeline: fetch data → render email → send email. vulnsig-deploy only defines the infrastructure (Lambda resource, EventBridge schedule, IAM role, env vars).

---

## Distribution List

### MVP

- Hard-coded array in an environment variable: `RECIPIENTS=you@example.com`
- Comma-separated, parsed at runtime
- No signup, no unsubscribe, no database

### Future (post-MVP)

- DynamoDB table for subscribers (see vulnsig-digest architecture doc)
- Signup API via API Gateway + Lambda (lives in vulnsig-deploy infra, handler code in vulnsig-digest or vulnsig-email)
- Double opt-in confirmation flow via Postmark
- Per-subscriber unsubscribe tokens
- `List-Unsubscribe` header with per-subscriber token URL

---

## Lambda Configuration

### Runtime

- Node.js 20.x
- Memory: 256 MB (sufficient for fetching JSON + rendering React Email)
- Timeout: 60 seconds

### Environment Variables

| Variable                | Description                      | Example                       |
| ----------------------- | -------------------------------- | ----------------------------- |
| `CVE_DATA_URL`          | URL to normalized CVE JSON on S3 | `https://vulnsig-feeds.s3...` |
| `KEV_DATA_URL`          | URL to normalized KEV JSON on S3 | `https://vulnsig-feeds.s3...` |
| `POSTMARK_SERVER_TOKEN` | Postmark API token               | `xxxxxxxx-xxxx-...`           |
| `FROM_EMAIL`            | Sender email address             | `digest@digest.vulnsig.io`    |
| `RECIPIENTS`            | Comma-separated email list (MVP) | `alice@example.com,bob@...`   |
| `GLYPH_BASE_URL`        | Base URL for glyph PNG endpoint  | `https://vulnsig.io/api/png`  |

### Schedule

- EventBridge rule: `cron(0 13 * * ? *)` — daily at 13:00 UTC (6:00 AM PT)
- Defined in vulnsig-deploy, not in this repo

---

## Repo Structure

```
vulnsig-digest/
├── README.md
├── package.json
├── tsconfig.json              # TypeScript config
├── src/
│   ├── handler.ts             # Lambda entry point
│   ├── data/
│   │   ├── types.ts           # CveEntry, CveDataset interfaces
│   │   ├── fetchFeeds.ts      # Fetch both CVE + KEV feeds (same CveDataset shape)
│   │   └── deduplicate.ts     # Remove CVEs with identical vectors
│   ├── email/
│   │   ├── DigestEmail.tsx    # Root React Email component
│   │   ├── components/
│   │   │   ├── Header.tsx     # Brand header with logo + date
│   │   │   ├── KevSection.tsx # KEV entries section
│   │   │   ├── CveSection.tsx # CVE entries section
│   │   │   ├── VulnRow.tsx    # Single vulnerability row (glyph + details)
│   │   │   ├── SeverityBadge.tsx
│   │   │   └── Footer.tsx     # Links + unsubscribe
│   │   └── styles.ts          # Shared color palette, fonts, spacing constants
│   └── send/
│       └── postmark.ts        # Postmark API integration
├── preview/                   # Local dev: preview emails in browser
│   └── dev.tsx
└── test/
    ├── data.test.ts           # Deduplication logic tests
    └── fixtures/
        ├── sample-cves.json
        └── sample-kevs.json
```

---

## Development Workflow

### No AWS Required for Development

The entire dev and test cycle runs locally without AWS credentials. The data sources are public S3 URLs accessed via plain HTTP. The glyph PNGs come from vulnsig.io via HTTP. Sending uses Postmark's API directly. The only AWS involvement is the eventual Lambda deployment, which is handled by vulnsig-deploy.

### Local Environment

Create a `.env` file (gitignored) for local development:

```bash
CVE_DATA_URL=https://...          # public S3 URL (same as NEXT_PUBLIC_CVE_DATA_URL)
KEV_DATA_URL=https://...          # public S3 URL (same as NEXT_PUBLIC_KEV_DATA_URL)
GLYPH_BASE_URL=https://vulnsig.io/api/png
POSTMARK_SERVER_TOKEN=xxxx        # only needed for send-test
FROM_EMAIL=digest@digest.vulnsig.io      # only needed for send-test
RECIPIENTS=you@example.com        # only needed for send-test
```

### Local Preview (no env vars needed)

React Email includes a dev server for previewing templates in the browser:

```bash
npm run dev        # starts preview server on localhost:3000
```

The preview server renders the template with fixture data from `test/fixtures/`. No network calls, no API keys — pure visual iteration on layout and styling.

### Send Test (needs POSTMARK_SERVER_TOKEN)

```bash
npm run send-test  # fetches LIVE data from S3, renders, sends via Postmark
```

This exercises the full pipeline end-to-end: fetch real CVE/KEV data, build glyph URLs, render the React Email template to HTML, and deliver via Postmark to your `RECIPIENTS`. The only credential required is the Postmark token.

### Build & Package

```bash
npm run build      # compiles TypeScript, bundles for Lambda
npm run package    # creates deployment zip
```

The build output should be a single zip suitable for Lambda upload. vulnsig-deploy can reference this artifact (either pulled from S3, or built in CI and uploaded).

### Unit Tests

```bash
npm test           # unit tests (dedup logic, data transforms, URL construction)
```

---

## DNS & Deliverability Checklist

Before sending the first real email:

- [ ] Add Postmark DKIM records to `digest.vulnsig.io` (2 CNAME records)
- [ ] Add Postmark Return-Path CNAME to `digest.vulnsig.io`
- [ ] Add SPF record to `digest.vulnsig.io` (or verify Postmark's is covered)
- [ ] Set up DMARC policy (`v=DMARC1; p=none;` to start, tighten later)
- [ ] Verify domain in Postmark dashboard
- [ ] Create a Broadcast message stream in Postmark
- [ ] Send test email and verify headers with mail-tester.com or similar

---

## Dependencies

### Runtime

- `@react-email/components` — React Email component library
- `@react-email/render` — Compile React components to HTML string
- `postmark` — Postmark Node.js SDK (or use raw `fetch` against their API)

### Dev

- `typescript`
- `@react-email/preview` — Local dev server
- `esbuild` or `tsup` — Bundle for Lambda
- `vitest` or `jest` — Testing

---

## Open Questions

1. **Product deduplication**: The identical-vector dedup is a rough filter. Better approaches might use CPE matching, NVD's `configurations` data, or even simple heuristics on the description field (e.g., grouping CVEs that mention the same product name). Worth revisiting once we see what the daily data actually looks like.

2. **Email frequency preferences**: Eventually subscribers may want different cadences (daily, weekly summary, critical-only alerts). This is post-MVP but worth keeping the data model flexible for.

3. **Glyph size for email**: The `/api/png` endpoint accepts `size` and `density` parameters. Need to test what size/density combination looks best across email clients — likely `size=128` displayed at 64×64 CSS pixels, but worth verifying in Outlook and Gmail.

## Resolved Decisions

- **Glyph PNG endpoint**: Already exists at `vulnsig.io/api/png` — no new endpoint needed.
- **No-data days**: Not a concern — there are always new CVEs and KEV additions daily.
- **KEV CVSS data**: Already enriched by the vulnsig-deploy KEV poller. Both feeds share the same `CveDataset` / `CveEntry` interface.
