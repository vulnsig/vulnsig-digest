import React from "react";
import { colors } from "../styles.js";

interface HighlightProductsProps {
  text: string;
  products: Set<string>;
  /** When true, only the first occurrence of each product is highlighted. */
  firstOnly?: boolean;
  /** Style variant: "bright" (default) for descriptions, "subtle" for summary. */
  variant?: "bright" | "subtle";
}

const highlightBright: React.CSSProperties = {
  color: colors.zinc300,
  fontWeight: 600,
};

const highlightSubtle: React.CSSProperties = {
  color: colors.gray400,
  fontWeight: 600,
};

/**
 * Renders text with product names highlighted in a brighter color.
 * Matching is case-insensitive; original casing from the text is preserved.
 */
export function HighlightProducts({ text, products, firstOnly, variant = "bright" }: HighlightProductsProps) {
  if (products.size === 0) return <>{text}</>;

  // Build a single regex that matches any product name (longest first to avoid partial matches)
  const sorted = [...products].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");

  const parts = text.split(pattern);
  if (parts.length === 1) return <>{text}</>;

  const seen = firstOnly ? new Set<string>() : null;

  return (
    <>
      {parts.map((part, i) => {
        if (pattern.test(part)) {
          const key = part.toLowerCase();
          if (seen && seen.has(key)) {
            return <React.Fragment key={i}>{part}</React.Fragment>;
          }
          seen?.add(key);
          return (
            <span key={i} style={variant === "bright" ? highlightBright : highlightSubtle}>
              {part}
            </span>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
