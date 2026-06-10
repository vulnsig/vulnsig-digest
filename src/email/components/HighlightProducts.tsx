import React from "react";
import { colors } from "../styles.js";

interface HighlightProductsProps {
  text: string;
  products: Set<string>;
  /** When true, only the first occurrence of each product is highlighted. */
  firstOnly?: boolean;
  /** Style variant: "bright" (default) for descriptions, "subtle" for summary. */
  variant?: "bright" | "subtle";
  /** When true, each highlighted product links to vulnsig's search interface. */
  linkProducts?: boolean;
}

/** Base URL for vulnsig's product search; the product name is appended as `q`. */
const SEARCH_BASE = "https://vulnsig.io/?tab=search";

const highlightBright: React.CSSProperties = {
  color: colors.zinc300,
  fontWeight: 600,
};

const highlightSubtle: React.CSSProperties = {
  color: colors.gray500,
  fontWeight: 600,
};

/**
 * Renders text with product names highlighted in a brighter color.
 * Matching is case-insensitive; original casing from the text is preserved.
 */
export function HighlightProducts({
  text,
  products,
  firstOnly,
  variant = "bright",
  linkProducts,
}: HighlightProductsProps) {
  if (products.size === 0) return <>{text}</>;

  // Build a single regex that matches any product name (longest first to avoid partial matches).
  // Lookarounds reject an adjacent letter/digit so we only match whole words, never mid-word
  // substrings ("sc" in "disclosures", "team" in "Steam"). An apostrophe is not [A-Za-z0-9], so
  // a possessive like "OpenOlat's" still matches its root "OpenOlat".
  const sorted = [...products].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(
    `(?<![A-Za-z0-9])(${escaped.join("|")})(?![A-Za-z0-9])`,
    "gi",
  );

  const parts = text.split(pattern);
  if (parts.length === 1) return <>{text}</>;

  const seen = firstOnly ? new Set<string>() : null;

  return (
    <>
      {parts.map((part, i) => {
        pattern.lastIndex = 0;
        if (pattern.test(part)) {
          const key = part.toLowerCase();
          if (seen && seen.has(key)) {
            return <React.Fragment key={i}>{part}</React.Fragment>;
          }
          seen?.add(key);
          const style =
            variant === "bright" ? highlightBright : highlightSubtle;
          if (linkProducts) {
            return (
              <a
                key={i}
                href={`${SEARCH_BASE}&q=${encodeURIComponent(part)}`}
                style={{ ...style, textDecoration: "none", cursor: "pointer" }}
              >
                {part}
              </a>
            );
          }
          return (
            <span key={i} style={style}>
              {part}
            </span>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
