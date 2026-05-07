import { describe, it, expect } from "vitest";
import { validateTransactionIds } from "@/lib/impact/validate";

describe("validateTransactionIds", () => {
  it("returns ok when all referenced IDs exist", () => {
    const validIds = new Set(["txn_a", "txn_b", "txn_c"]);
    const payload = {
      affectedTransactions: [
        { transactionId: "txn_a", reason: "x", requiredActions: ["y"] },
        { transactionId: "txn_b", reason: "x", requiredActions: ["y"] },
      ],
    };
    expect(validateTransactionIds(payload, validIds)).toEqual({ ok: true });
  });

  it("returns error with the missing IDs", () => {
    const validIds = new Set(["txn_a"]);
    const payload = {
      affectedTransactions: [
        { transactionId: "txn_a", reason: "x", requiredActions: ["y"] },
        { transactionId: "txn_HALLUCINATED", reason: "x", requiredActions: ["y"] },
        { transactionId: "txn_ALSO_FAKE", reason: "x", requiredActions: ["y"] },
      ],
    };
    expect(validateTransactionIds(payload, validIds)).toEqual({
      ok: false,
      missingIds: ["txn_HALLUCINATED", "txn_ALSO_FAKE"],
    });
  });

  it("returns ok when the affected list is empty", () => {
    expect(validateTransactionIds({ affectedTransactions: [] }, new Set())).toEqual({ ok: true });
  });
});
