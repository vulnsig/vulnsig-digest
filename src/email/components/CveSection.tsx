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
        Recent Common Vulnerabilities and Exposures
      </Heading>
      <Text style={subtitle}>New vulnerabilities published in last 24h</Text>
      {entries.map((entry) => (
        <VulnRow
          key={entry.id}
          entry={entry}
          glyphBaseUrl={glyphBaseUrl}
          variant="cve"
        />
      ))}
    </Section>
  );
}

const container: React.CSSProperties = {
  padding: `${spacing.lg}px ${spacing.xl}px`,
  borderTop: `1px solid ${colors.border}`,
};

const heading: React.CSSProperties = {
  fontFamily: fonts.mono,
  fontSize: 11,
  fontWeight: 700,
  color: colors.text,
  margin: 0,
  letterSpacing: "0.1em",
};

const subtitle: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 13,
  color: colors.textMuted,
  margin: `${spacing.xs}px 0 ${spacing.md}px`,
};
