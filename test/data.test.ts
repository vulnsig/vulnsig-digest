import { describe, it, expect } from "vitest";
import { deduplicateByVector } from "../src/data/deduplicate.js";
import { selectRecent } from "../src/data/fetchFeeds.js";
import { glyphUrl } from "../src/data/glyph.js";
import type { CveEntry } from "../src/data/types.js";
import sampleCves from "./fixtures/sample-cves.json";

const entries: CveEntry[] = sampleCves.cves;

describe("deduplicateByVector", () => {
  it("removes entries with identical CVSS vectors", () => {
    const result = deduplicateByVector(entries);
    const vectors = result.map((e) => e.cvss.vectorString);
    expect(new Set(vectors).size).toBe(vectors.length);
  });

  it("keeps the first occurrence (most recent when pre-sorted)", () => {
    const result = deduplicateByVector(entries);
    const ids = result.map((e) => e.id);
    expect(ids).toContain("CVE-2026-10001");
    expect(ids).not.toContain("CVE-2026-10004");
  });

  it("returns all entries when no duplicates exist", () => {
    const unique = entries.filter((e) => e.id !== "CVE-2026-10004");
    const result = deduplicateByVector(unique);
    expect(result.length).toBe(unique.length);
  });
});

describe("selectRecent", () => {
  it("returns the N most recent entries sorted by published date", () => {
    const result = selectRecent(entries, 3);
    expect(result.length).toBe(3);
    expect(result[0].id).toBe("CVE-2026-10001");
    expect(result[1].id).toBe("CVE-2026-10002");
    expect(result[2].id).toBe("CVE-2026-10003");
  });

  it("returns all entries when count exceeds array length", () => {
    const result = selectRecent(entries, 100);
    expect(result.length).toBe(entries.length);
  });
});

describe("glyphUrl", () => {
  it("constructs a valid glyph URL", () => {
    const url = glyphUrl(entries[0], "https://vulnsig.io/api/png");
    expect(url).toContain("vulnsig.io/api/png?");
    expect(url).toContain("vector=");
    expect(url).toContain("score=9.8");
    expect(url).toContain("size=128");
    expect(url).toContain("density=72");
  });

  it("allows custom size", () => {
    const url = glyphUrl(entries[0], "https://vulnsig.io/api/png", 256);
    expect(url).toContain("size=256");
  });

  it("allows custom density", () => {
    const url = glyphUrl(entries[0], "https://vulnsig.io/api/png", 128, 144);
    expect(url).toContain("density=144");
  });
});
