import { Heading, Section, Text } from "@react-email/components";
import { colors, fonts, spacing } from "../styles.js";

interface HeaderProps {
  date: string;
}

export function Header({ date }: HeaderProps) {
  return (
    <Section style={container}>
      <Heading as="h1" style={title}>
        VulnSig Daily Digest
      </Heading>
      <Text style={subtitle}>{date}</Text>
      <Text style={link}>vulnsig.io</Text>
    </Section>
  );
}

const container: React.CSSProperties = {
  backgroundColor: colors.headerBg,
  padding: `${spacing.lg}px ${spacing.xl}px`,
  textAlign: "center" as const,
};

const title: React.CSSProperties = {
  color: colors.headerText,
  fontFamily: fonts.sans,
  fontSize: 24,
  fontWeight: 700,
  margin: 0,
};

const subtitle: React.CSSProperties = {
  color: "#a0aec0",
  fontFamily: fonts.sans,
  fontSize: 14,
  margin: `${spacing.xs}px 0 0`,
};

const link: React.CSSProperties = {
  color: "#60a5fa",
  fontFamily: fonts.sans,
  fontSize: 12,
  margin: `${spacing.xs}px 0 0`,
};
