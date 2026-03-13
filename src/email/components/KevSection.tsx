import { Heading, Section, Text } from "@react-email/components";
import type { CveEntry } from "../../data/types.js";
import { colors, fonts, spacing } from "../styles.js";
import { VulnRow } from "./VulnRow.js";

interface KevSectionProps {
  entries: CveEntry[];
  glyphBaseUrl: string;
  windowDays: number;
}

export function KevSection({
  entries,
  glyphBaseUrl,
  windowDays,
}: KevSectionProps) {
  if (entries.length === 0) return null;

  return (
    <Section style={container}>
      <Heading as="h2" style={heading}>
        Known Exploited Vulnerabilities (KEV)
      </Heading>
      <Text style={subtitle}>
        Added to CISA KEV catalog in the last {windowDays} days
      </Text>
      {entries.map((entry) => (
        <Section key={entry.id} style={rowContainer}>
          <VulnRow entry={entry} glyphBaseUrl={glyphBaseUrl} variant="kev" />
        </Section>
      ))}
    </Section>
  );
}

const container: React.CSSProperties = {
  padding: `${spacing.lg}px ${spacing.xl}px`,
  borderTop: `1px solid ${colors.zinc800}`,
};

const rowContainer: React.CSSProperties = {
  // borderBottom: `1px solid ${colors.zinc800}`,
};

const heading: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 15,
  fontWeight: 700,
  color: colors.zinc400,
  margin: 0,
  // letterSpacing: "0.1em",
};

const subtitle: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 13,
  color: colors.zinc500,
  margin: `${spacing.xs}px 0 ${spacing.md}px`,
};
