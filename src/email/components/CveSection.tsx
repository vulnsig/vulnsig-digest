import { Heading, Section, Text } from "@react-email/components";
import type { CveEntry } from "../../data/types.js";
import { colors, fonts, spacing } from "../styles.js";
import { VulnRow } from "./VulnRow.js";

interface CveSectionProps {
  entries: CveEntry[];
  glyphBaseUrl: string;
}

export function CveSection({ entries, glyphBaseUrl }: CveSectionProps) {
  if (entries.length === 0) return null;

  return (
    <Section style={container}>
      <Heading as="h2" style={heading}>
        RECENT CVEs
      </Heading>
      <Text style={subtitle}>New vulnerabilities published in last 24h</Text>
      {entries.map((entry) => (
        <VulnRow key={entry.id} entry={entry} glyphBaseUrl={glyphBaseUrl} />
      ))}
    </Section>
  );
}

const container: React.CSSProperties = {
  padding: `${spacing.lg}px ${spacing.xl}px`,
  borderTop: `2px solid ${colors.border}`,
};

const heading: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 16,
  fontWeight: 700,
  color: colors.text,
  margin: 0,
};

const subtitle: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 13,
  color: colors.textMuted,
  margin: `${spacing.xs}px 0 ${spacing.md}px`,
};
