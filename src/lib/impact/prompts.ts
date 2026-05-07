type ClientForPrompt = {
  id: string;
  name: string;
  sector: string;
  turnoverCr: number;
  ownership: string;
  city: string;
};

type CounterpartyForPrompt = {
  name: string;
  type: "vendor" | "customer";
  concentrationPct: number;
  isFormallyRelated: boolean;
};

type TransactionForPrompt = {
  id: string;
  invoiceNumber: string;
  amount: number;
  date: string;
  type: "purchase" | "sale";
  description: string;
  counterpartyName: string;
};

type CircularForPrompt = {
  title: string;
  source: string;
  date: string;
  content: string;
  affectedActs: string[];
};

export const IMPACT_SYSTEM_PROMPT = `You are an Indian Chartered Accountant assistant analyzing how a regulatory circular impacts a specific client's transactions. Be concrete, reference specific counterparty names, percentages, and invoice numbers from the data provided. Output ONLY valid JSON matching the schema below — no preamble, no markdown fences, no commentary.

Output schema:
{
  "severity": "critical" | "high" | "medium" | "low" | "not_affected",
  "summary": string (1-2 sentences),
  "rationale": string (longer explanation referencing concrete counterparty names and percentages),
  "affectedTransactions": [
    { "transactionId": string (must match an ID from the input), "reason": string, "requiredActions": [string] }
  ],
  "concentrationMetrics": null OR { "counterpartyName": string, "percentage": number, "threshold": number },
  "totalAmount": number (sum of affected transactions in INR),
  "totalCount": number (count of affected transactions)
}

If the client is not affected at all, set severity to "not_affected", affectedTransactions to [], totalAmount to 0, totalCount to 0, and concentrationMetrics to null. Always reference real transaction IDs from the input — never invent transaction IDs.`;

export function buildImpactUserPrompt(args: {
  circular: CircularForPrompt;
  client: ClientForPrompt;
  counterparties: CounterpartyForPrompt[];
  transactions: TransactionForPrompt[];
}): string {
  const { circular, client, counterparties, transactions } = args;

  const txnLines = transactions
    .map(
      (t) =>
        `  - id="${t.id}" | invoice=${t.invoiceNumber} | ${t.type} | counterparty="${t.counterpartyName}" | amount=₹${t.amount.toLocaleString("en-IN")} | date=${t.date} | desc="${t.description}"`,
    )
    .join("\n");

  const cpLines = counterparties
    .map(
      (c) =>
        `  - "${c.name}" (${c.type}) — concentration=${c.concentrationPct}%, formallyRelated=${c.isFormallyRelated}`,
    )
    .join("\n");

  return `# Circular
Title: ${circular.title}
Source: ${circular.source} (${circular.date})
Affected Acts: ${circular.affectedActs.join(", ")}

Content:
${circular.content}

# Client Profile
- Name: ${client.name}
- Sector: ${client.sector}
- Turnover: ₹${client.turnoverCr} cr
- Ownership: ${client.ownership}
- City: ${client.city}

# Counterparty Concentration
${cpLines}

# Recent Transactions
${txnLines}

# Task
Analyze the impact of the above circular on this specific client. Identify which transactions become newly classified or require new disclosure under the amended provision. Reference the counterparty by name and the concentration percentage explicitly in your rationale. Use actual transaction IDs from the list above in affectedTransactions.

Return ONLY the JSON object — no other text.`;
}

export const COMM_SYSTEM_PROMPT = `You are an Indian Chartered Accountant drafting a personalized client communication about how a specific circular impacts their business. Be specific (reference counterparty names, invoice counts, deadlines), professional, and actionable. Output ONLY valid JSON matching the schema below — no preamble, no markdown fences.

Output schema:
{
  "subject": string (concise, action-oriented),
  "body": string (markdown-formatted; 4-8 short paragraphs; addresses client by name; references the specific counterparty and threshold; lists the required actions; specifies the deadline; signs off as "[CA's name / firm]"),
  "channel": "email"
}`;

export function buildCommUserPrompt(args: {
  circular: CircularForPrompt;
  client: ClientForPrompt;
  impactSummary: string;
  impactRationale: string;
  affectedCount: number;
  totalAmount: number;
  deadline: string;
}): string {
  const { circular, client, impactSummary, impactRationale, affectedCount, totalAmount, deadline } = args;
  return `# Circular
Title: ${circular.title}
Source: ${circular.source}

# Client
- Name: ${client.name}
- Sector: ${client.sector}

# Impact Analysis (already computed)
- Summary: ${impactSummary}
- Rationale: ${impactRationale}
- Affected transactions: ${affectedCount}
- Total amount: ₹${(totalAmount / 1e7).toFixed(2)} cr
- Deadline: ${deadline}

# Task
Draft a personalized email to the client about this. Address them by their company name. Reference the specific counterparty and percentage from the rationale. List the required actions concretely. Include the deadline. Keep it 4-8 short paragraphs. Sign off as "Karan Kotai / [Firm]".

Return ONLY the JSON object — no other text.`;
}
