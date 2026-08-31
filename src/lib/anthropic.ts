import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return client;
}

export type StructuredCallOptions = {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  model?: string;
};

export async function callClaude(opts: StructuredCallOptions): Promise<string> {
  const c = getClient();
  const response = await c.messages.create({
    model: opts.model ?? "claude-opus-4-7",
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.systemPrompt,
    messages: [{ role: "user", content: opts.userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Anthropic response had no text block");
  }
  return textBlock.text;
}

export function extractJson<T = unknown>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const trimmed = raw.trim();
  return JSON.parse(trimmed) as T;
}
