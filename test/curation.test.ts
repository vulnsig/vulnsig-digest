import { describe, it, expect, vi, beforeEach } from "vitest";
import { groupAndSelect } from "../src/curation/groupAndSelect.js";
import { fallbackCuration } from "../src/curation/fallback.js";
import type { CveEntry } from "../src/data/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCve(
  id: string,
  product: string,
  score: number,
  published = "2026-03-11T10:00:00Z",
  vector = `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/E:${id}`,
): CveEntry & { product: string } {
  return {
    id,
    published,
    description: `Description for ${id}`,
    cvss: { version: "3.1", vectorString: vector, baseScore: score },
    product,
  };
}

// ---------------------------------------------------------------------------
// groupAndSelect
// ---------------------------------------------------------------------------

describe("groupAndSelect", () => {
  it("groups CVEs with the same product", () => {
    const input = [
      makeCve("CVE-001", "OpenSSL", 9.8),
      makeCve("CVE-002", "OpenSSL", 7.5),
      makeCve("CVE-003", "Chrome", 8.0),
    ];
    const { curated } = groupAndSelect(input);
    expect(curated).toHaveLength(2);
    const openssl = curated.find((c) => c.product === "OpenSSL")!;
    expect(openssl.representative.id).toBe("CVE-001");
    expect(openssl.related.map((r) => r.id)).toEqual(["CVE-002"]);
  });

  it("selects highest score as representative", () => {
    const input = [
      makeCve("CVE-001", "Windows", 6.5),
      makeCve("CVE-002", "Windows", 9.8),
      makeCve("CVE-003", "Windows", 7.2),
    ];
    const { curated } = groupAndSelect(input);
    expect(curated[0].representative.id).toBe("CVE-002");
  });

  it("breaks score ties by most recent published date", () => {
    const input = [
      makeCve("CVE-001", "nginx", 9.8, "2026-03-10T08:00:00Z"),
      makeCve("CVE-002", "nginx", 9.8, "2026-03-11T10:00:00Z"),
    ];
    const { curated } = groupAndSelect(input);
    expect(curated[0].representative.id).toBe("CVE-002");
  });

  it("caps output at the specified limit", () => {
    const input = Array.from({ length: 25 }, (_, i) =>
      makeCve(`CVE-${String(i).padStart(3, "0")}`, `Product${i}`, 5.0),
    );
    const { curated } = groupAndSelect(input, 20, 0);
    expect(curated).toHaveLength(20);
  });

  it("adds diversity picks with unique vectors beyond the cap", () => {
    const sharedVector = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H";
    const input = Array.from({ length: 20 }, (_, i) =>
      makeCve(`CVE-${String(i).padStart(3, "0")}`, `Top${i}`, 9.0, undefined, sharedVector),
    );
    input.push(
      makeCve("CVE-DIV1", "DiverseA", 3.0, undefined, "CVSS:3.1/AV:L/AC:H/PR:H/UI:R/S:U/C:L/I:N/A:N"),
      makeCve("CVE-DIV2", "DiverseB", 2.0, undefined, "CVSS:3.1/AV:P/AC:H/PR:H/UI:R/S:U/C:N/I:L/A:N"),
    );
    const { curated } = groupAndSelect(input, 20, 5);
    expect(curated).toHaveLength(22);
    const products = curated.map((c) => c.product);
    expect(products).toContain("DiverseA");
    expect(products).toContain("DiverseB");
  });

  it("does not add diversity picks with already-seen vectors", () => {
    const sharedVector = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H";
    const input = Array.from({ length: 22 }, (_, i) =>
      makeCve(`CVE-${String(i).padStart(3, "0")}`, `Prod${i}`, 9.0 - i * 0.1, undefined, sharedVector),
    );
    const { curated } = groupAndSelect(input, 20, 5);
    expect(curated).toHaveLength(20); // no diversity picks since all vectors are identical
  });

  it("sorts groups by representative published date descending", () => {
    const input = [
      makeCve("CVE-001", "Alpha", 5.0, "2026-03-11T08:00:00Z"),
      makeCve("CVE-002", "Beta", 9.8, "2026-03-11T12:00:00Z"),
      makeCve("CVE-003", "Gamma", 7.5, "2026-03-11T10:00:00Z"),
    ];
    const { curated } = groupAndSelect(input);
    expect(curated.map((c) => c.product)).toEqual(["Beta", "Gamma", "Alpha"]);
  });

  it("treats 'Unknown' as a normal group", () => {
    const input = [
      makeCve("CVE-001", "Unknown", 8.0),
      makeCve("CVE-002", "Unknown", 6.0),
    ];
    const { curated, totalProductsFound } = groupAndSelect(input);
    expect(curated).toHaveLength(1);
    expect(curated[0].product).toBe("Unknown");
    expect(totalProductsFound).toBe(1);
  });

  it("returns empty related array for single-CVE groups", () => {
    const input = [makeCve("CVE-001", "SoloProduct", 7.0)];
    const { curated } = groupAndSelect(input);
    expect(curated[0].related).toEqual([]);
  });

  it("groups case-insensitively", () => {
    const input = [
      makeCve("CVE-001", "openssl", 9.0),
      makeCve("CVE-002", "OpenSSL", 8.0),
    ];
    const { curated } = groupAndSelect(input);
    expect(curated).toHaveLength(1);
  });

  it("reports totalProductsFound before the cap", () => {
    const input = Array.from({ length: 25 }, (_, i) =>
      makeCve(`CVE-${i}`, `Product${i}`, 5.0),
    );
    const { totalProductsFound } = groupAndSelect(input, 20);
    expect(totalProductsFound).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// extractProducts (mocked)
// ---------------------------------------------------------------------------

describe("extractProducts", () => {
  beforeEach(() => vi.resetModules());

  it("parses a valid JSON response", async () => {
    vi.doMock("@anthropic-ai/sdk", () => ({
      default: class {
        messages = {
          create: async () => ({
            content: [
              {
                type: "text",
                text: JSON.stringify([
                  { id: "CVE-001", product: "OpenSSL" },
                  { id: "CVE-002", product: "Chrome" },
                ]),
              },
            ],
          }),
        };
      },
    }));
    const { extractProducts } =
      await import("../src/curation/extractProducts.js");
    const cves: CveEntry[] = [
      makeCve("CVE-001", "", 9.8),
      makeCve("CVE-002", "", 7.5),
    ];
    const result = await extractProducts(cves);
    expect(result[0].product).toBe("OpenSSL");
    expect(result[1].product).toBe("Chrome");
  });

  it("handles markdown-fenced JSON", async () => {
    vi.doMock("@anthropic-ai/sdk", () => ({
      default: class {
        messages = {
          create: async () => ({
            content: [
              {
                type: "text",
                text: '```json\n[{"id":"CVE-001","product":"nginx"}]\n```',
              },
            ],
          }),
        };
      },
    }));
    const { extractProducts } =
      await import("../src/curation/extractProducts.js");
    const cves: CveEntry[] = [makeCve("CVE-001", "", 8.0)];
    const result = await extractProducts(cves);
    expect(result[0].product).toBe("nginx");
  });

  it("falls back to Unknown on malformed response", async () => {
    vi.doMock("@anthropic-ai/sdk", () => ({
      default: class {
        messages = {
          create: async () => ({
            content: [{ type: "text", text: "not json at all" }],
          }),
        };
      },
    }));
    const { extractProducts } =
      await import("../src/curation/extractProducts.js");
    const cves: CveEntry[] = [makeCve("CVE-001", "", 9.0)];
    const result = await extractProducts(cves);
    expect(result[0].product).toBe("Unknown");
  });

  it("retries once on API failure then falls back to Unknown", async () => {
    let calls = 0;
    vi.doMock("@anthropic-ai/sdk", () => ({
      default: class {
        messages = {
          create: async () => {
            calls++;
            throw new Error("API error");
          },
        };
      },
    }));
    const { extractProducts } =
      await import("../src/curation/extractProducts.js");
    const cves: CveEntry[] = [makeCve("CVE-001", "", 9.0)];
    const result = await extractProducts(cves);
    expect(calls).toBe(2); // initial + 1 retry
    expect(result[0].product).toBe("Unknown");
  });

  it("matches response to input by id when array length mismatches", async () => {
    vi.doMock("@anthropic-ai/sdk", () => ({
      default: class {
        messages = {
          create: async () => ({
            content: [
              {
                type: "text",
                // Only returns one of the two
                text: JSON.stringify([{ id: "CVE-002", product: "Windows" }]),
              },
            ],
          }),
        };
      },
    }));
    const { extractProducts } =
      await import("../src/curation/extractProducts.js");
    const cves: CveEntry[] = [
      makeCve("CVE-001", "", 9.8),
      makeCve("CVE-002", "", 7.5),
    ];
    const result = await extractProducts(cves);
    expect(result.find((r) => r.id === "CVE-001")!.product).toBe("Unknown");
    expect(result.find((r) => r.id === "CVE-002")!.product).toBe("Windows");
  });
});

// ---------------------------------------------------------------------------
// fallbackCuration
// ---------------------------------------------------------------------------

describe("fallbackCuration", () => {
  const sharedVector = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H";

  it("deduplicates by identical vectorString", () => {
    const cves: CveEntry[] = [
      {
        id: "CVE-001",
        published: "2026-03-11T10:00:00Z",
        description: "A",
        cvss: { version: "3.1", vectorString: sharedVector, baseScore: 9.8 },
      },
      {
        id: "CVE-002",
        published: "2026-03-10T08:00:00Z",
        description: "B",
        cvss: { version: "3.1", vectorString: sharedVector, baseScore: 9.8 },
      },
    ];
    const result = fallbackCuration(cves);
    expect(result.curated).toHaveLength(1);
  });

  it("keeps the most recent entry when deduplicating", () => {
    const cves: CveEntry[] = [
      {
        id: "CVE-001",
        published: "2026-03-11T10:00:00Z",
        description: "A",
        cvss: { version: "3.1", vectorString: sharedVector, baseScore: 9.8 },
      },
      {
        id: "CVE-002",
        published: "2026-03-10T08:00:00Z",
        description: "B",
        cvss: { version: "3.1", vectorString: sharedVector, baseScore: 9.8 },
      },
    ];
    const result = fallbackCuration(cves);
    expect(result.curated[0].representative.id).toBe("CVE-001");
  });

  it("returns top 20 by score", () => {
    const cves: CveEntry[] = Array.from({ length: 25 }, (_, i) => ({
      id: `CVE-${i}`,
      published: "2026-03-11T10:00:00Z",
      description: "x",
      cvss: {
        version: "3.1",
        vectorString: `CVSS:3.1/UNIQUE/${i}`,
        baseScore: i * 0.4,
      },
    }));
    const result = fallbackCuration(cves);
    expect(result.curated).toHaveLength(20);
    expect(result.curated[0].representative.cvss.baseScore).toBe(24 * 0.4);
  });

  it("sets curatedWithLlm to false", () => {
    const result = fallbackCuration([
      {
        id: "CVE-001",
        published: "2026-03-11T10:00:00Z",
        description: "x",
        cvss: {
          version: "3.1",
          vectorString: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
          baseScore: 9.8,
        },
      },
    ]);
    expect(result.curatedWithLlm).toBe(false);
    expect(result.summary).toBe("");
  });
});
