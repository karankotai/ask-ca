import { z, type ZodTypeAny } from "zod";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logWarn } from "./logging";

// --- Parameter validation helpers -----------------------------------------
export const IntIdParam = z
  .string()
  .refine((s) => /^\d+$/.test(s), { message: "id must be an integer" })
  .transform((s) => Number(s));

export function parseNumericId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
}

// --- Chat/question schemas (still used by demo/evaluate flows if any) -----
export const QuestionSchema = z.object({
  question: z.string().min(1, "Question is empty").max(10000, "Question too long"),
});

export const EvaluateBodySchema = z.object({
  question: z.string().min(1).max(10_000),
  ground_truth: z.string().min(1).max(10_000).optional(),
  source_filter: z.array(z.string()).optional(),
  baselines: z.array(z.string()).optional(),
});

export const AnalyzeRunSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  runId: z.string().min(1).max(64).optional(),
  analysis: z.string().min(1).max(500_000),
});

export const ComplianceToggleSchema = z.object({
  completed: z.boolean().optional(),
  dismissed: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
});

// --- Demo seed / admin schemas -------------------------------------------
export const AdminCrawlSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(50),
  scope: z.string().min(1).max(100).optional(),
});

export const AdminIndexSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1).max(500),
});

export const ObligationsExtractSchema = z.object({
  input_text: z.string().min(1).max(1_000_000),
  mode: z.enum(["circular", "client_text", "faq"]).default("circular"),
  jurisdiction: z.string().min(1).max(100).optional(),
  client_name: z.string().min(1).max(200).optional(),
});

export const CircularListParamsSchema = z.object({
  q: z.string().max(200).optional(),
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => Math.max(parseInt(String(v ?? "1"), 10) || 1, 1)),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => Math.min(Math.max(parseInt(String(v ?? "50"), 10) || 50, 1), 200)),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  category: z.string().max(100).optional(),
});

// --- Parse helpers --------------------------------------------------------
export type ValidationErrorResponse = NextResponse<{
  error: string;
  details: z.ZodIssue[];
}>;

export async function parseBody<T extends ZodTypeAny>(
  req: NextRequest,
  schema: T,
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; error: ValidationErrorResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch (e) {
    logWarn("validation.body.json", "Invalid JSON body", { error: String(e) });
    return {
      ok: false,
      error: NextResponse.json(
        { error: "Invalid JSON body.", details: [] as z.ZodIssue[] },
        { status: 400 },
      ),
    };
  }
  const res = schema.safeParse(raw);
  if (!res.success) {
    logWarn("validation.body.schema", "Schema validation failed", { issues: res.error.issues.length });
    return {
      ok: false,
      error: NextResponse.json(
        { error: "Invalid input.", details: res.error.issues },
        { status: 400 },
      ),
    };
  }
  return { ok: true, data: res.data };
}

export function parseSearchParams<T extends ZodTypeAny>(
  url: URL,
  schema: T,
): { ok: true; data: z.infer<T> } | { ok: false; error: ValidationErrorResponse } {
  const raw: Record<string, string | string[] | undefined> = {};
  for (const [k, v] of url.searchParams.entries()) {
    if (Object.prototype.hasOwnProperty.call(raw, k)) {
      const prev = raw[k];
      raw[k] = Array.isArray(prev) ? [...prev, v] : [prev as string, v];
    } else {
      raw[k] = v;
    }
  }
  const res = schema.safeParse(raw);
  if (!res.success) {
    return {
      ok: false,
      error: NextResponse.json(
        { error: "Invalid query parameters.", details: res.error.issues },
        { status: 400 },
      ),
    };
  }
  return { ok: true, data: res.data };
}
