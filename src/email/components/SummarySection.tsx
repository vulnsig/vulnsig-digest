import { Section, Text } from "@react-email/components";
import { colors, fonts, spacing } from "../styles.js";

interface SummarySectionProps {
  summary: string;
  curatedWithLlm: boolean;
}

export function SummarySection({
  summary,
  curatedWithLlm,
}: SummarySectionProps) {
  if (!summary && curatedWithLlm) return null;

  return (
    <Section style={container}>
      {curatedWithLlm && <Text style={badge}>LLM-generated summary</Text>}
      {summary &&
        summary.split(/\n\n+/).map((para, i) => (
          <Text key={i} style={body}>
            {para}
          </Text>
        ))}
      {!curatedWithLlm && (
        <Text style={fallbackNote}>
          Today's digest is unedited — automated curation was unavailable.
        </Text>
      )}
    </Section>
  );
}

const container: React.CSSProperties = {
  padding: `${spacing.lg}px ${spacing.xl}px`,
  borderTop: `1px solid ${colors.border}`,
};

const badge: React.CSSProperties = {
  fontFamily: fonts.mono,
  fontSize: 10,
  fontWeight: 700,
  color: colors.textMuted,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  margin: `0 0 ${spacing.sm}px`,
};

const body: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 14,
  color: colors.text,
  lineHeight: "22px",
  margin: `0 0 ${spacing.md}px`,
};

const fallbackNote: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 12,
  fontStyle: "italic",
  color: colors.textMuted,
  margin: `${spacing.sm}px 0 0`,
};
