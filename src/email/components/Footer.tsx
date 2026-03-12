import { Link, Section, Text } from "@react-email/components";
import { colors, fonts, spacing } from "../styles.js";

export function Footer() {
  return (
    <Section style={container}>
      <Text style={text}>
        <Link href="https://vulnsig.io" style={link}>
          View all vulnerabilities at vulnsig.io
        </Link>
      </Text>
      <Text style={muted}>
        You are receiving this because you subscribed to VulnSig Daily Digest.
      </Text>
    </Section>
  );
}

const container: React.CSSProperties = {
  padding: `${spacing.lg}px ${spacing.xl}px`,
  borderTop: `2px solid ${colors.border}`,
  textAlign: "center" as const,
};

const text: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 14,
  margin: 0,
};

const link: React.CSSProperties = {
  color: colors.link,
};

const muted: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 12,
  color: colors.textMuted,
  margin: `${spacing.sm}px 0 0`,
};
