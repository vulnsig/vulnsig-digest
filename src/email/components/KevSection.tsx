import { Heading, Section, Text } from "@react-email/components";
import type { CveEntry } from "../../data/types.js";
import { colors, fonts, spacing } from "../styles.js";
import { VulnRow } from "./VulnRow.js";

interface KevSectionProps {
  entries: CveEntry[];
  glyphBaseUrl: string;
}

export function KevSection({ entries, glyphBaseUrl }: KevSectionProps) {
  if (entries.length === 0) return null;

  return (
    <Section style={container}>
      <Heading as="h2" style={heading}>
        KNOWN EXPLOITED VULNERABILITIES (KEV)
      </Heading>
      <Text style={subtitle}>Recently added to CISA KEV catalog</Text>
      {entries.map((entry) => (
        <VulnRow key={entry.id} entry={entry} glyphBaseUrl={glyphBaseUrl} />
      ))}
    </Section>
  );
}

const container: React.CSSProperties = {
  padding: `${spacing.lg}px ${spacing.xl}px`,
};

const heading: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 16,
  fontWeight: 700,
  color: colors.severity.CRITICAL,
  margin: 0,
};

const subtitle: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 13,
  color: colors.textMuted,
  margin: `${spacing.xs}px 0 ${spacing.md}px`,
};
