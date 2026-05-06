import { describe, it, expect } from "vitest";
import { ImpactAnalysisPayloadSchema, DraftCommPayloadSchema } from "@/lib/impact/schema";

describe("ImpactAnalysisPayloadSchema", () => {
  it("accepts a fully populated payload", () => {
    const valid = {
      severity: "high",
      summary: "Astra has 12 RPT-classified transactions to disclose.",
      rationale: "Helix Chemicals provides 47% of API spend; new threshold is 40%.",
      affectedTransactions: [
        {
          transactionId: "txn_astra_4521",
          reason: "Purchase from Helix; threshold crossed",
          requiredActions: ["board approval", "disclosure"],
        },
      ],
      concentrationMetrics: {
        counterpartyName: "Helix Chemicals Pvt Ltd",
        percentage: 47,
        threshold: 40,
      },
      totalAmount: 142000000,
      totalCount: 12,
    };
    expect(() => ImpactAnalysisPayloadSchema.parse(valid)).not.toThrow();
  });

  it("accepts a 'not_affected' payload with empty transactions", () => {
    const valid = {
      severity: "not_affected",
      summary: "No exposure.",
      rationale: "No counterparty crosses the 40% threshold.",
      affectedTransactions: [],
      concentrationMetrics: null,
      totalAmount: 0,
      totalCount: 0,
    };
    expect(() => ImpactAnalysisPayloadSchema.parse(valid)).not.toThrow();
  });

  it("rejects unknown severity", () => {
    const bad = {
      severity: "catastrophic",
      summary: "x",
      rationale: "y",
      affectedTransactions: [],
      concentrationMetrics: null,
      totalAmount: 0,
      totalCount: 0,
    };
    expect(() => ImpactAnalysisPayloadSchema.parse(bad)).toThrow();
  });

  it("rejects missing requiredActions on affected transaction", () => {
    const bad = {
      severity: "high",
      summary: "x",
      rationale: "y",
      affectedTransactions: [{ transactionId: "t1", reason: "r" }],
      concentrationMetrics: null,
      totalAmount: 0,
      totalCount: 0,
    };
    expect(() => ImpactAnalysisPayloadSchema.parse(bad)).toThrow();
  });
});

describe("DraftCommPayloadSchema", () => {
  it("accepts a valid draft", () => {
    const valid = {
      subject: "Action required: Sec 188 disclosure for FY26 Helix transactions",
      body: "Dear sir,\n\nThe MCA has amended Sec 188...",
      channel: "email",
    };
    expect(() => DraftCommPayloadSchema.parse(valid)).not.toThrow();
  });

  it("rejects empty body", () => {
    const bad = { subject: "x", body: "", channel: "email" };
    expect(() => DraftCommPayloadSchema.parse(bad)).toThrow();
  });
});
