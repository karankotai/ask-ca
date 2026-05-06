import { callClaude, extractJson } from "../anthropic";
import { ImpactAnalysisPayloadSchema, type ImpactAnalysisPayload } from "./schema";
import { validateTransactionIds } from "./validate";
import { IMPACT_SYSTEM_PROMPT, buildImpactUserPrompt } from "./prompts";

type RunImpactArgs = Parameters<typeof buildImpactUserPrompt>[0] & {
  validTransactionIds: Set<string>;
  maxRetries?: number;
};

export async function runImpactAnalysis(args: RunImpactArgs): Promise<ImpactAnalysisPayload> {
  const maxRetries = args.maxRetries ?? 2;
  const userPrompt = buildImpactUserPrompt(args);
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const augmentedPrompt = lastError
      ? `${userPrompt}\n\n# Previous attempt failed validation: ${lastError}\nFix the issue and return valid JSON.`
      : userPrompt;

    const text = await callClaude({
      systemPrompt: IMPACT_SYSTEM_PROMPT,
      userPrompt: augmentedPrompt,
    });

    let parsed: unknown;
    try {
      parsed = extractJson(text);
    } catch (e) {
      lastError = `Could not parse JSON from response: ${(e as Error).message}`;
      continue;
    }

    const schemaResult = ImpactAnalysisPayloadSchema.safeParse(parsed);
    if (!schemaResult.success) {
      lastError = `Schema validation failed: ${schemaResult.error.message}`;
      continue;
    }

    const txnResult = validateTransactionIds(schemaResult.data, args.validTransactionIds);
    if (txnResult.ok === false) {
      lastError = `Hallucinated transaction IDs: ${txnResult.missingIds.join(", ")}. Use only IDs from the input list.`;
      continue;
    }

    return schemaResult.data;
  }

  throw new Error(`runImpactAnalysis failed after ${maxRetries + 1} attempts. Last error: ${lastError}`);
}
