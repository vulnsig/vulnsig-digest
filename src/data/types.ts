export interface CveEntry {
  id: string;
  published: string;
  description: string;
  cvss: {
    version: string;
    vectorString: string;
    baseScore: number;
  };
}

export interface CveDataset {
  generatedAt: string;
  windowStart: string;
  windowEnd: string;
  cves: CveEntry[];
}

export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE";

export interface CuratedCve {
  product: string;
  representative: CveEntry;
  related: CveEntry[];
}

export interface CurationResult {
  curated: CuratedCve[];
  summary: string;
  totalCvesInFeed: number;
  totalProductsFound: number;
  curatedWithLlm: boolean;
}

/** Serialized snapshot written by curate-debug, read by preview/dev.tsx */
export interface DigestSnapshot {
  date: string;
  curation: CurationResult;
  kevs: CveEntry[];
  kevWindowDays: number;
}
