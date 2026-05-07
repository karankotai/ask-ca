import { callClaude, extractJson } from "../anthropic";
import { DraftCommPayloadSchema, type DraftCommPayload } from "./schema";
import { COMM_SYSTEM_PROMPT, buildCommUserPrompt } from "./prompts";

type RunCommArgs = Parameters<typeof buildCommUserPrompt>[0] & {
  maxRetries?: number;
};

export async function runCommDraft(args: RunCommArgs): Promise<DraftCommPayload> {
  const maxRetries = args.maxRetries ?? 1;
  const userPrompt = buildCommUserPrompt(args);
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const augmentedPrompt = lastError
      ? `${userPrompt}\n\n# Previous attempt failed: ${lastError}`
      : userPrompt;

    const text = await callClaude({
      systemPrompt: COMM_SYSTEM_PROMPT,
      userPrompt: augmentedPrompt,
      maxTokens: 2048,
    });

    let parsed: unknown;
    try {
      parsed = extractJson(text);
    } catch (e) {
      lastError = `Could not parse JSON: ${(e as Error).message}`;
      continue;
    }

    const result = DraftCommPayloadSchema.safeParse(parsed);
    if (!result.success) {
      lastError = `Schema failed: ${result.error.message}`;
      continue;
    }
    return result.data;
  }

  throw new Error(`runCommDraft failed after ${maxRetries + 1} attempts. Last: ${lastError}`);
}
