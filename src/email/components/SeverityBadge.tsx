import { Text } from "@react-email/components";
import { severityFromScore, type SeverityLevel } from "../../data/types.js";
import { colors, fonts } from "../styles.js";

interface SeverityBadgeProps {
  score: number;
}

export function SeverityBadge({ score }: SeverityBadgeProps) {
  const level = severityFromScore(score);
  const color = colors.severity[level];

  return (
    <Text style={{ ...badge, backgroundColor: color }}>
      {level} {score.toFixed(1)}
    </Text>
  );
}

const badge: React.CSSProperties = {
  color: "#ffffff",
  fontFamily: fonts.sans,
  fontSize: 11,
  fontWeight: 700,
  padding: "2px 8px",
  borderRadius: 4,
  display: "inline-block",
  margin: 0,
  lineHeight: "18px",
};
