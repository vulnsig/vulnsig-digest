import { Heading, Section, Text } from "@react-email/components";
import type { CuratedCve } from "../../data/types.js";
import { colors, fonts, spacing } from "../styles.js";
import { VulnRow } from "./VulnRow.js";

interface CveSectionProps {
  curated: CuratedCve[];
  glyphBaseUrl: string;
}

export function CveSection({ curated, glyphBaseUrl }: CveSectionProps) {
  if (curated.length === 0) return null;

  return (
    <Section style={container}>
      <Heading as="h2" style={heading}>
        Recent Common Vulnerabilities and Exposures
      </Heading>
      <Text style={subtitle}>New vulnerabilities published in last 24h</Text>
      {curated.map((group) => (
        <Section key={group.representative.id}>
          <Text style={productLabel}>{group.product}</Text>
          <VulnRow
            entry={group.representative}
            glyphBaseUrl={glyphBaseUrl}
            variant="cve"
          />
          {group.related.length > 0 && (
            <Text style={relatedNote}>
              +{group.related.length} related:{" "}
              {group.related.map((r) => r.id).join(", ")}
            </Text>
          )}
        </Section>
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

const productLabel: React.CSSProperties = {
  fontFamily: fonts.mono,
  fontSize: 10,
  fontWeight: 700,
  color: colors.textMuted,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  margin: `${spacing.md}px 0 0`,
};

const relatedNote: React.CSSProperties = {
  fontFamily: fonts.mono,
  fontSize: 11,
  color: colors.textMuted,
  margin: `${spacing.xs}px 0 0`,
};
