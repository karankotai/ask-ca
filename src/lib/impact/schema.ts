import { z } from "zod";

export const SeveritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
  "not_affected",
]);
export type Severity = z.infer<typeof SeveritySchema>;

export const AffectedTransactionSchema = z.object({
  transactionId: z.string().min(1),
  reason: z.string().min(1),
  requiredActions: z.array(z.string().min(1)),
});

export const ConcentrationMetricsSchema = z.object({
  counterpartyName: z.string().min(1),
  percentage: z.number().min(0).max(100),
  threshold: z.number().min(0).max(100),
});

export const ImpactAnalysisPayloadSchema = z.object({
  severity: SeveritySchema,
  summary: z.string().min(1),
  rationale: z.string().min(1),
  affectedTransactions: z.array(AffectedTransactionSchema),
  concentrationMetrics: ConcentrationMetricsSchema.nullable(),
  totalAmount: z.number().min(0),
  totalCount: z.number().int().min(0),
});
export type ImpactAnalysisPayload = z.infer<typeof ImpactAnalysisPayloadSchema>;

export const DraftCommPayloadSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  channel: z.enum(["email", "whatsapp"]),
});
export type DraftCommPayload = z.infer<typeof DraftCommPayloadSchema>;
