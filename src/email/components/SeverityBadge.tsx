import { Text } from "@react-email/components";
import { scoreBadgeBg, scoreBadgeTextColor, fonts } from "../styles.js";

interface SeverityBadgeProps {
  score: number;
}

export function SeverityBadge({ score }: SeverityBadgeProps) {
  const bg = scoreBadgeBg(score);
  const fg = scoreBadgeTextColor(score);

  return (
    <Text style={{ ...badge, backgroundColor: bg, color: fg }}>
      {score.toFixed(1)}
    </Text>
  );
}

const badge: React.CSSProperties = {
  fontFamily: fonts.mono,
  fontSize: 11,
  fontWeight: 700,
  padding: "2px 8px",
  borderRadius: 4,
  display: "inline-block",
  margin: 0,
  lineHeight: "18px",
  letterSpacing: "0.04em",
};
