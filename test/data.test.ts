import { describe, it, expect } from "vitest";
import { selectWithinWindow } from "../src/data/fetchFeeds.js";
import { glyphUrl } from "../src/data/glyph.js";
import type { CveEntry } from "../src/data/types.js";
import sampleCves from "./fixtures/sample-cves.json";

const entries: CveEntry[] = sampleCves.cves;

describe("selectWithinWindow", () => {
  it("returns entries published at or after the cutoff", () => {
    // cutoff at 08:45Z — includes 09:00, 09:30, 10:00 (3 entries)
    const cutoff = new Date("2026-03-11T08:45:00Z");
    const result = selectWithinWindow(entries, cutoff);
    expect(result.map((e) => e.id)).toEqual([
      "CVE-2026-10001",
      "CVE-2026-10002",
      "CVE-2026-10003",
    ]);
  });

  it("includes entries published exactly at the cutoff", () => {
    const cutoff = new Date("2026-03-11T08:00:00Z");
    const result = selectWithinWindow(entries, cutoff);
    expect(result.map((e) => e.id)).toContain("CVE-2026-10005");
  });

  it("returns all entries when cutoff is before all published dates", () => {
    const cutoff = new Date("2026-03-01T00:00:00Z");
    expect(selectWithinWindow(entries, cutoff).length).toBe(entries.length);
  });

  it("returns no entries when cutoff is after all published dates", () => {
    const cutoff = new Date("2026-03-12T00:00:00Z");
    expect(selectWithinWindow(entries, cutoff).length).toBe(0);
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
