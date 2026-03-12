import { Column, Img, Row, Section, Text } from "@react-email/components";
import type { CveEntry } from "../../data/types.js";
import { glyphUrl } from "../../data/glyph.js";
import { colors, fonts, spacing, truncate } from "../styles.js";
import { SeverityBadge } from "./SeverityBadge.js";

interface VulnRowProps {
  entry: CveEntry;
  glyphBaseUrl: string;
}

export function VulnRow({ entry, glyphBaseUrl }: VulnRowProps) {
  const imgSrc = glyphUrl(entry, glyphBaseUrl, 128);
  const altText = `VulnSig glyph for ${entry.id} — CVSS ${entry.cvss.baseScore}`;

  return (
    <Section style={container}>
      <Row>
        <Column style={glyphCol}>
          <Img
            src={imgSrc}
            alt={altText}
            width={64}
            height={64}
            style={glyphImg}
          />
        </Column>
        <Column style={detailsCol}>
          <Text style={cveId}>{entry.id}</Text>
          <SeverityBadge score={entry.cvss.baseScore} />
          <Text style={description}>{truncate(entry.description)}</Text>
        </Column>
      </Row>
    </Section>
  );
}

const container: React.CSSProperties = {
  borderBottom: `1px solid ${colors.border}`,
  padding: `${spacing.md}px 0`,
};

const glyphCol: React.CSSProperties = {
  width: 72,
  verticalAlign: "top",
  paddingRight: spacing.sm,
};

const glyphImg: React.CSSProperties = {
  borderRadius: 4,
};

const detailsCol: React.CSSProperties = {
  verticalAlign: "top",
};

const cveId: React.CSSProperties = {
  fontFamily: fonts.mono,
  fontSize: 14,
  fontWeight: 700,
  color: colors.text,
  margin: 0,
};

const description: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 13,
  color: colors.textMuted,
  margin: `${spacing.xs}px 0 0`,
  lineHeight: "18px",
};
