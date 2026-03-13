import { Heading, Link, Section, Text } from "@react-email/components";
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
        <Section key={group.representative.id} style={groupContainer}>
          <VulnRow
            entry={group.representative}
            glyphBaseUrl={glyphBaseUrl}
            variant="cve"
          />
          {group.related.length > 0 && (
            <Text style={relatedNote}>
              {group.related.length} related:{" "}
              {group.related.map((r, i) => (
                <span key={r.id}>
                  {i > 0 && ", "}
                  <Link
                    href={`https://nvd.nist.gov/vuln/detail/${r.id}`}
                    style={relatedLink}
                  >
                    {r.id}
                  </Link>
                </span>
              ))}
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

const groupContainer: React.CSSProperties = {
  borderBottom: `1px solid ${colors.border}`,
};

const relatedNote: React.CSSProperties = {
  fontFamily: fonts.mono,
  fontSize: 11,
  color: colors.textMuted,
  margin: `${spacing.xs}px 0 0`,
};

const relatedLink: React.CSSProperties = {
  color: colors.text,
  textDecoration: "none",
};
