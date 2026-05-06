type ValidationResult =
  | { ok: true }
  | { ok: false; missingIds: string[] };

type PayloadWithTransactions = {
  affectedTransactions: Array<{ transactionId: string }>;
};

export function validateTransactionIds(
  payload: PayloadWithTransactions,
  validTransactionIds: Set<string>,
): ValidationResult {
  const missingIds = payload.affectedTransactions
    .map((t) => t.transactionId)
    .filter((id) => !validTransactionIds.has(id));

  if (missingIds.length === 0) return { ok: true };
  return { ok: false, missingIds };
}
