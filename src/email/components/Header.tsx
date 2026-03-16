import { Heading, Section, Text } from "@react-email/components";
import { colors, fonts, spacing } from "../styles.js";

interface HeaderProps {
  date: string;
}

export function Header({ date }: HeaderProps) {
  return (
    <Section style={container}>
      <Heading as="h1" style={title}>
        VulnSig
      </Heading>
      <Text style={tagline}>more than a score</Text>
      <Text style={digest}>Daily Digest · {date}</Text>
    </Section>
  );
}

const container: React.CSSProperties = {
  backgroundColor: colors.zinc950,
  padding: `${spacing.lg}px ${spacing.xl}px`,
  textAlign: "center" as const,
  borderBottom: `1px solid ${colors.zinc800}`,
};

const title: React.CSSProperties = {
  color: colors.zinc300,
  fontFamily: fonts.sans,
  fontSize: 28,
  fontWeight: 700,
  letterSpacing: "0.05em",
  margin: 0,
};

const tagline: React.CSSProperties = {
  color: colors.zinc500,
  fontFamily: fonts.sans,
  fontSize: 13,
  fontStyle: "italic",
  margin: `${spacing.xs}px 0 0`,
};

const digest: React.CSSProperties = {
  color: colors.zinc500,
  fontFamily: fonts.sans,
  fontSize: 12,
  margin: `${spacing.sm}px 0 0`,
  // letterSpacing: "0.08em",
};
