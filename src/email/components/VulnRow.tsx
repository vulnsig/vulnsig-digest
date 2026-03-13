import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
import type { CveEntry } from "../../data/types.js";
import { glyphUrl } from "../../data/glyph.js";
import { colors, fonts, spacing, truncate } from "../styles.js";
import { SeverityBadge } from "./SeverityBadge.js";

interface VulnRowProps {
  entry: CveEntry;
  glyphBaseUrl: string;
  variant: "cve" | "kev";
  children?: React.ReactNode;
}

function formatDateTime(iso: string): string {
  const utcIso = iso.endsWith("Z") || /T.*[+-]/.test(iso) ? iso : `${iso}Z`;
  return new Date(utcIso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function VulnRow({ entry, glyphBaseUrl, variant, children }: VulnRowProps) {
  const imgSrc = glyphUrl(entry, glyphBaseUrl, 100, 144);
  const altText = `VulnSig glyph for ${entry.id} — CVSS ${entry.cvss.baseScore}`;
  const nvdUrl = `https://nvd.nist.gov/vuln/detail/${entry.id}`;
  const dateLabel =
    variant === "cve"
      ? formatDateTime(entry.published)
      : formatDate(entry.published);

  return (
    <Section style={container}>
      <Row>
        <Column style={glyphCol}>
          <Img
            src={imgSrc}
            alt={altText}
            width={100}
            height={100}
            style={glyphImg}
          />
        </Column>
        <Column style={detailsCol}>
          <Text style={cveIdStyle}>
            <Link href={nvdUrl} style={cveLink}>
              {entry.id}
            </Link>
          </Text>
          <SeverityBadge score={entry.cvss.baseScore} />
          <Text style={subtitle}>
            {dateLabel} · CVSS {entry.cvss.version}
          </Text>
          <Text style={description}>{truncate(entry.description)}</Text>
          {children}
        </Column>
      </Row>
    </Section>
  );
}

const container: React.CSSProperties = {
  padding: `${spacing.sm}px 0`,
};

const glyphCol: React.CSSProperties = {
  width: 80,
  verticalAlign: "top",
  paddingRight: spacing.md,
};

const glyphImg: React.CSSProperties = {
  borderRadius: 6,
  display: "block",
};

const detailsCol: React.CSSProperties = {
  verticalAlign: "top",
};

const cveIdStyle: React.CSSProperties = {
  fontFamily: fonts.mono,
  fontSize: 13,
  fontWeight: 700,
  margin: `0 0 ${spacing.xs}px`,
};

const cveLink: React.CSSProperties = {
  color: colors.zinc300,
  textDecoration: "none",
};

const subtitle: React.CSSProperties = {
  fontFamily: fonts.mono,
  fontSize: 11,
  color: colors.zinc500,
  margin: `${spacing.xs}px 0 0`,
  letterSpacing: "0.02em",
};

const description: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 13,
  color: colors.zinc400,
  margin: `${spacing.xs}px 0 0`,
  lineHeight: "19px",
};
