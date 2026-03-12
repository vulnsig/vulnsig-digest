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

export function severityFromScore(score: number): SeverityLevel {
  if (score >= 9.0) return "CRITICAL";
  if (score >= 7.0) return "HIGH";
  if (score >= 4.0) return "MEDIUM";
  if (score > 0) return "LOW";
  return "NONE";
}
