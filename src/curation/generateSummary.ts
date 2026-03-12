import Anthropic from "@anthropic-ai/sdk";
import type { CuratedCve } from "../data/types.js";
import { SUMMARY_SYSTEM_PROMPT, buildSummaryUserPrompt } from "./prompts.js";

export async function generateSummary(
  curated: CuratedCve[],
  totalCvesInFeed: number,
): Promise<string> {
  const client = new Anthropic();
  const userPrompt = buildSummaryUserPrompt(curated, totalCvesInFeed);

  const attempt = () =>
    client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 300,
      system: SUMMARY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

  let response;
  try {
    response = await attempt();
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
    response = await attempt(); // throws on second failure — caught by caller
  }

  const text =
    response.content[0]?.type === "text" ? response.content[0].text : "";
  return text.trim();
}
