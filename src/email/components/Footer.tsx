import { Link, Section, Text } from "@react-email/components";
import { colors, fonts, spacing } from "../styles.js";

export function Footer() {
  return (
    <Section style={container}>
      <Text style={text}>
        <Link href="https://vulnsig.io" style={link}>
          vulnsig.io
        </Link>
      </Text>
      <Text style={muted}>
        You are receiving this because you subscribed to the VulnSig Digest.{" "}
        <Link href="{{UNSUBSCRIBE_URL}}" style={unsubscribeLink}>
          Unsubscribe
        </Link>
      </Text>
    </Section>
  );
}

const container: React.CSSProperties = {
  backgroundColor: colors.zinc950,
  padding: `${spacing.md}px ${spacing.xl}px`,
  borderTop: `1px solid ${colors.zinc800}`,
  textAlign: "center" as const,
};

const text: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 13,
  margin: 0,
};

const link: React.CSSProperties = {
  color: colors.zinc400,
  // textDecoration: "underline",
};

const muted: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 11,
  color: colors.zinc500,
  margin: `${spacing.sm}px 0 0`,
  lineHeight: "17px",
};

const unsubscribeLink: React.CSSProperties = {
  color: colors.zinc500,
  textDecoration: "underline",
};
