import { Heading, Section, Text } from "@react-email/components";
import type { CuratedCve, ProductInfo } from "../../data/types.js";
import { colors, fonts, spacing } from "../styles.js";
import { VulnRow } from "./VulnRow.js";

interface CveSectionProps {
  curated: CuratedCve[];
  glyphBaseUrl: string;
  products?: Record<string, ProductInfo>;
}

export function CveSection({
  curated,
  glyphBaseUrl,
  products,
}: CveSectionProps) {
  if (curated.length === 0) return null;

  return (
    <Section style={container}>
      <Heading as="h2" style={heading}>
        Recent Common Vulnerabilities and Exposures (CEV)
      </Heading>
      <Text style={subtitle}>
        New vulnerabilities published in the last 24 hours
      </Text>
      {curated.map((group) => (
        <Section key={group.representative.id} style={groupContainer}>
          <VulnRow
            entry={group.representative}
            glyphBaseUrl={glyphBaseUrl}
            variant="cve"
            products={products}
          >
            {group.related.length > 0 && (
              <Text style={relatedNote}>
                {group.related.length} related:{" "}
                {group.related.map((r, i) => (
                  <span key={r.id}>
                    {i > 0 && ", "}
                    {r.id}
                  </span>
                ))}
              </Text>
            )}
          </VulnRow>
        </Section>
      ))}
    </Section>
  );
}

const container: React.CSSProperties = {
  padding: `${spacing.lg}px ${spacing.xl}px`,
  borderTop: `1px solid ${colors.zinc800}`,
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

const groupContainer: React.CSSProperties = {
  // borderBottom: `1px solid ${colors.zinc800}`,
};

const relatedNote: React.CSSProperties = {
  fontFamily: fonts.mono,
  fontSize: 11,
  color: colors.zinc500,
  lineHeight: "19px",
  margin: `${spacing.xs}px 0 0`,
};
