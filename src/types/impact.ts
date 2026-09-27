export type ImpactPayload = {
  severity: string;
  summary: string;
  rationale: string;
  affectedTransactions: Array<{
    transactionId: string;
    reason: string;
    requiredActions: string[];
  }>;
  concentrationMetrics: {
    counterpartyName: string;
    percentage: number;
    threshold: number;
  } | null;
  totalAmount: number;
  totalCount: number;
};

export type ImpactAnalysisWithClient = {
  id: string;
  circularId: number;
  clientId: string;
  payload: ImpactPayload;
  client: {
    id: string;
    name: string;
    sector: string;
  };
  createdAt: Date;
  updatedAt: Date;
};
