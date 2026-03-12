import Anthropic from "@anthropic-ai/sdk";
import type { CveEntry } from "../data/types.js";
import {
  EXTRACTION_SYSTEM_PROMPT,
  buildExtractionUserPrompt,
} from "./prompts.js";

const BATCH_SIZE = 20;
const MAX_PARALLEL = 3;

type Annotated = CveEntry & { product: string };

interface ExtractionItem {
  id: string;
  product: string;
}

function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

function parseExtractionResponse(
  text: string,
  batch: CveEntry[],
): ExtractionItem[] {
  try {
    const parsed: ExtractionItem[] = JSON.parse(stripFences(text));
    if (!Array.isArray(parsed)) throw new Error("Not an array");

    // If lengths match, trust positional order
    if (parsed.length === batch.length) return parsed;

    // Lengths differ — match by id, fill unknowns for misses
    const byId = new Map(parsed.map((item) => [item.id, item.product]));
    return batch.map((cve) => ({
      id: cve.id,
      product: byId.get(cve.id) ?? "Unknown",
    }));
  } catch {
    return batch.map((cve) => ({ id: cve.id, product: "Unknown" }));
  }
}

async function extractBatch(
  client: Anthropic,
  batch: CveEntry[],
): Promise<ExtractionItem[]> {
  const userPrompt = buildExtractionUserPrompt(
    batch.map((e) => ({ id: e.id, description: e.description })),
  );

  const attempt = async () =>
    client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: EXTRACTION_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });

  let response;
  try {
    response = await attempt();
  } catch {
    // Retry once with exponential backoff
    await new Promise((r) => setTimeout(r, 1000));
    try {
      response = await attempt();
    } catch {
      return batch.map((cve) => ({ id: cve.id, product: "Unknown" }));
    }
  }

  const text =
    response.content[0]?.type === "text" ? response.content[0].text : "";
  return parseExtractionResponse(text, batch);
}

export async function extractProducts(cves: CveEntry[]): Promise<Annotated[]> {
  const batches: CveEntry[][] = [];
  for (let i = 0; i < cves.length; i += BATCH_SIZE) {
    batches.push(cves.slice(i, i + BATCH_SIZE));
  }

  const productMap = new Map<string, string>();

  // Run batches with limited concurrency
  const client = new Anthropic();
  for (let i = 0; i < batches.length; i += MAX_PARALLEL) {
    const chunk = batches.slice(i, i + MAX_PARALLEL);
    const results = await Promise.all(
      chunk.map((batch) => extractBatch(client, batch)),
    );
    for (const items of results) {
      for (const item of items) {
        productMap.set(item.id, item.product);
      }
    }
  }

  return cves.map((cve) => ({
    ...cve,
    product: productMap.get(cve.id) ?? "Unknown",
  }));
}
