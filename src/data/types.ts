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
