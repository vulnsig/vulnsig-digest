import Anthropic from "@anthropic-ai/sdk";
import type { CuratedCve } from "../data/types.js";
import { SUMMARY_SYSTEM_PROMPT, buildSummaryUserPrompt } from "./prompts.js";

export async function generateSummary(
  curated: CuratedCve[],
  totalCvesInFeed: number,
  prevSummary = "",
): Promise<string> {
  const client = new Anthropic();
  const userPrompt = buildSummaryUserPrompt(
    curated,
    totalCvesInFeed,
    prevSummary,
  );

  const response = await client.messages.create({
    model: "claude-opus-5-5",
    // Opus 5.5 thinks by default and thinking tokens come out of max_tokens,
    // so leave headroom above what the summary itself needs.
    max_tokens: 4096,
    system: SUMMARY_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  // The text block is not necessarily content[0] - a thinking block precedes it.
  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text",
  );
  let text = stripMarkdown((textBlock?.text ?? "").trim());

  // If the response was truncated (hit token limit), trim the trailing
  // incomplete sentence so we don't end mid-word.
  if (response.stop_reason === "max_tokens") {
    text = trimToLastSentence(text);
  }

  // Fail loudly rather than silently returning "" - an empty summary makes the
  // whole section disappear from the digest with no other trace.
  if (!text) {
    throw new Error(
      `Summary generation produced no text (stop_reason: ${response.stop_reason})`,
    );
  }

  return text;
}

/** Trim to the last complete sentence (ending in . ! or ?). */
function trimToLastSentence(text: string): string {
  const match = text.match(/^([\s\S]*[.!?])\s*/);
  return match ? match[1].trim() : text;
}

/** Remove markdown formatting that doesn't render in email HTML. */
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/\*(.+?)\*/g, "$1") // italic
    .replace(/__(.+?)__/g, "$1") // bold (underscores)
    .replace(/_(.+?)_/g, "$1") // italic (underscores)
    .replace(/`(.+?)`/g, "$1") // inline code
    .replace(/^\s*[-*+]\s+/gm, "") // unordered list markers
    .replace(/^\s*\d+\.\s+/gm, "") // ordered list markers
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // links → text only
    .trim();
}
