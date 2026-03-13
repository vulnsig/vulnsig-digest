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

const body: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 14,
  color: colors.text,
  lineHeight: "22px",
  margin: 0,
};

const fallbackNote: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 12,
  fontStyle: "italic",
  color: colors.textMuted,
  margin: `${spacing.sm}px 0 0`,
};
