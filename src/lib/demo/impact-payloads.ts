// Pre-written impact analyses and comm drafts.
// These were AI-generated and curated for demo reliability — same architecture
// as the offline-AI flow described in the spec, just authored inline rather
// than via a one-shot Anthropic precompute call.
//
// Key invariants:
//  - transactionId values must match seeded Transaction.id values from cast.ts
//  - totalAmount and totalCount must match the affectedTransactions list
//  - concentrationMetrics references real counterparties from cast.ts
//
// Demo flow only ever drills into:
//   (live-drop circular) × (Astra | Northwind | Steelvine)
// The other 15 cells exist for completeness — they populate the impact view's
// left pane on other circulars and let the dashboard exposure number reflect
// realistic cross-circular numbers.

import type { ImpactAnalysisPayload, DraftCommPayload } from "../impact/schema";
import { ASTRA_HELIX_TXNS, NORTHWIND_PARENT_TXNS, STEELVINE_OEM_TXNS } from "./cast";

type CellKey = `${string}__${string}`; // `${circularNumber}__${clientId}`

type ImpactCell = {
  circularNumber: string;
  clientId: string;
  payload: ImpactAnalysisPayload;
  comm?: DraftCommPayload;
};

// ─── 1. Live-drop circular × Astra (THE CRESCENDO) ─────────────────────────
const LIVE_DROP_ASTRA: ImpactCell = {
  circularNumber: "MCA/2026/188-AMD-01",
  clientId: "client_astra",
  payload: {
    severity: "high",
    summary:
      "Astra Formulations has 12 transactions newly classified as related-party transactions (RPT) under the amended Section 188. All are purchases from Helix Chemicals, which now crosses the 40% economic-dependence threshold for vendor concentration.",
    rationale:
      "Helix Chemicals Pvt Ltd supplies ₹14.20 cr of Astra's ₹30.21 cr total API spend in FY2025-26 — a concentration of 47%, above the new 40% threshold introduced by the amendment. Although Helix has no equity link or directorship overlap with Astra, the economic-dependence test now classifies it as a related party for disclosure purposes. All 12 purchase invoices to Helix in the current FY require retrospective board approval under Sec 188(1), audit committee ratification under Sec 177(4), and disclosure in the board's report under Sec 188(2) — all due by 31 May 2026. Non-disclosure exposes the company to penalties up to ₹25 lakh per officer in default.",
    affectedTransactions: ASTRA_HELIX_TXNS.map((t, i) => ({
      transactionId: t.id,
      reason: `Purchase from Helix Chemicals (${t.invoiceNumber}, ${t.date}) is now an RPT under amended Sec 188 — Helix's 47% concentration exceeds the 40% economic-dependence threshold.`,
      requiredActions:
        i === 0
          ? [
              "Obtain retrospective board approval under Sec 188(1)",
              "Place before audit committee for ratification under Sec 177(4)",
              "Disclose in board's report under Sec 188(2) for FY2025-26",
              "Update RPT register (Form MBP-4)",
            ]
          : [
              "Include in retrospective board approval batch",
              "Add to FY2025-26 RPT disclosure schedule",
            ],
    })),
    concentrationMetrics: {
      counterpartyName: "Helix Chemicals Pvt Ltd",
      percentage: 47,
      threshold: 40,
    },
    totalAmount: ASTRA_HELIX_TXNS.reduce((s, t) => s + t.amount, 0),
    totalCount: ASTRA_HELIX_TXNS.length,
  },
  comm: {
    subject:
      "Action required by 31 May 2026 — Section 188 RPT disclosure for Helix Chemicals transactions (FY2025-26)",
    body: `Dear Astra team,

The Ministry of Corporate Affairs has notified an amendment to Section 188 of the Companies Act 2013 (G.S.R. 312(E), 6 May 2026), introducing an **economic-dependence test** for related-party classification. Under the amended rule, any vendor providing more than 40% of category-level supply must be treated as a related party — irrespective of equity linkage.

**How this affects Astra:** Helix Chemicals Pvt Ltd currently supplies 47% of your API spend (₹14.20 cr of ₹30.21 cr in FY2025-26). Helix is therefore a related party for the purposes of Sec 188 with effect from this FY. Twelve invoices placed with Helix during the year are now RPTs requiring disclosure.

**What we need to do — by 31 May 2026:**
1. Place all twelve transactions before the board for **retrospective approval** under Sec 188(1)
2. Obtain **audit committee ratification** under Sec 177(4)
3. Add the disclosures to the **board's report** under Sec 188(2) for FY2025-26
4. Update **Form MBP-4** (Register of Contracts under Sec 189)

The fastest path is to schedule a special board meeting in the next two weeks. We will prepare the draft RPT schedule, the omnibus approval resolution, and the audit committee note. Please confirm a date by 12 May so we can circulate the agenda.

The penalty exposure for non-disclosure is up to ₹25 lakh per officer in default plus voidability of the contract — well worth the procedural effort to close out cleanly before 31 May.

Best regards,
Karan Kotai
For [Your firm name]`,
    channel: "email",
  },
};

// ─── 2. Live-drop × Northwind ──────────────────────────────────────────────
const LIVE_DROP_NORTHWIND: ImpactCell = {
  circularNumber: "MCA/2026/188-AMD-01",
  clientId: "client_northwind",
  payload: {
    severity: "high",
    summary:
      "Northwind Tech India has 4 transactions newly classified as RPT under amended Section 188. All are revenue invoices to Northwind Inc Group, which crosses the 30% revenue-side economic-dependence threshold. There is also a transfer-pricing methodology overlap to address.",
    rationale:
      "Northwind Inc Group (US parent's group entity) accounts for 38% of Northwind India's revenue in FY2025-26 (₹6.10 cr of ₹16.05 cr ARR), exceeding the new 30% revenue-side threshold under the amended Sec 188. Although the parent already has equity linkage that triggers existing RPT rules, the amendment now also requires the four FY invoices to be tested against the economic-dependence threshold and the disclosure to reference the methodology basis. Concurrently, since the same transactions are subject to Sec 92E transfer-pricing reporting, the Sec 188 disclosure must be aligned with the Form 3CEB methodology to avoid contradictory positions across filings.",
    affectedTransactions: NORTHWIND_PARENT_TXNS.map((t) => ({
      transactionId: t.id,
      reason: `Revenue invoice to Northwind Inc Group (${t.invoiceNumber}, ${t.date}) — group entity's 38% revenue concentration exceeds the new 30% threshold under amended Sec 188.`,
      requiredActions: [
        "Disclose under Sec 188(2) for FY2025-26",
        "Reconcile pricing methodology with Form 3CEB transfer-pricing report",
        "Add audit committee note on TP-RPT alignment",
      ],
    })),
    concentrationMetrics: {
      counterpartyName: "Northwind Inc Group",
      percentage: 38,
      threshold: 30,
    },
    totalAmount: NORTHWIND_PARENT_TXNS.reduce((s, t) => s + t.amount, 0),
    totalCount: NORTHWIND_PARENT_TXNS.length,
  },
  comm: {
    subject:
      "Action required by 31 May 2026 — Section 188 RPT disclosure for parent-group invoices (with TP alignment)",
    body: `Dear Northwind India team,

The MCA has amended Section 188 to introduce a 30% revenue-side **economic-dependence test** for related-party classification (G.S.R. 312(E), 6 May 2026). This applies in addition to the existing equity-linkage test.

**How this affects Northwind India:** invoices raised on Northwind Inc Group represent 38% of Northwind India's FY2025-26 revenue (₹6.10 cr / ₹16.05 cr ARR). The four invoices issued during the year — SI-2782, SI-2818, SI-2854, and SI-2891 — are RPTs by both equity-linkage *and* the new economic-dependence test, which means the Sec 188 disclosure must now reference the **pricing methodology** explicitly.

**Important alignment point:** because these same transactions are reported under Section 92E (Form 3CEB transfer-pricing report), the methodology disclosed under Sec 188 must be **consistent** with the TP report's arm's-length basis. A mismatch between the two filings is the most common audit-committee finding in inbound-subsidiary structures.

**What we need to do — by 31 May 2026:**
1. Disclose all four transactions under Sec 188(2) in the FY2025-26 board's report
2. Reconcile the Sec 188 methodology disclosure with the existing Form 3CEB position
3. Tabulate before the audit committee with a TP-RPT alignment note

We can prepare the Sec 188 schedule alongside the Form 3CEB review your team is already running. Please confirm whether you want a single combined audit-committee item or separate notes.

Best regards,
Karan Kotai
For [Your firm name]`,
    channel: "email",
  },
};

// ─── 3. Live-drop × Steelvine ──────────────────────────────────────────────
const LIVE_DROP_STEELVINE: ImpactCell = {
  circularNumber: "MCA/2026/188-AMD-01",
  clientId: "client_steelvine",
  payload: {
    severity: "critical",
    summary:
      "Steelvine has 47 transactions across the full FY newly classified as RPT under amended Section 188 — all revenue invoices to Bharat Motors Ltd (its principal OEM, 78% of revenue). This is a historical-exposure case requiring full-year retrospective disclosure.",
    rationale:
      "Bharat Motors Ltd is Steelvine's tier-1 OEM customer and accounts for 78% of revenue (₹49.00 cr of ₹62.82 cr in FY2025-26) — far above the new 30% economic-dependence threshold. Although there is no equity linkage between Steelvine and Bharat Motors, the dependence has been informally known for years; the amendment now formalises it as RPT and triggers retrospective disclosure for the entire current FY. With 47 invoices spanning April 2025 to date, this is a substantial omnibus approval and disclosure exercise. Non-disclosure here is materially riskier than the others — given the volume and the materiality (78% of revenue), an audit qualification is realistic without timely action.",
    affectedTransactions: STEELVINE_OEM_TXNS.map((t, i) => ({
      transactionId: t.id,
      reason: `Sale to Bharat Motors Ltd (${t.invoiceNumber}, ${t.date}) — OEM concentration of 78% far exceeds the 30% revenue-side threshold under amended Sec 188.`,
      requiredActions:
        i === 0
          ? [
              "Pass omnibus board resolution under Sec 188(1) for FY2025-26 OEM transactions",
              "Audit committee ratification under Sec 177(4)",
              "Full-year disclosure under Sec 188(2)",
              "Update Form MBP-4 register",
              "Coordinate with statutory auditor on RPT note for upcoming financials",
            ]
          : ["Include in omnibus approval batch", "Add to FY2025-26 RPT schedule"],
    })),
    concentrationMetrics: {
      counterpartyName: "Bharat Motors Ltd",
      percentage: 78,
      threshold: 30,
    },
    totalAmount: STEELVINE_OEM_TXNS.reduce((s, t) => s + t.amount, 0),
    totalCount: STEELVINE_OEM_TXNS.length,
  },
  comm: {
    subject:
      "URGENT — 47 OEM invoices need RPT disclosure by 31 May 2026 (Section 188 amendment)",
    body: `Dear Steelvine team,

The MCA has amended Section 188 to introduce a 30% revenue-side **economic-dependence test** for related-party classification (G.S.R. 312(E), 6 May 2026). This will need our urgent attention.

**The exposure:** Bharat Motors Ltd accounts for 78% of Steelvine's FY2025-26 revenue (₹49.00 cr of ₹62.82 cr). Under the amended rule, every invoice raised on Bharat Motors during the current FY is now a related-party transaction requiring disclosure — that's **47 invoices** across the full year.

While the operational dependence on Bharat Motors has long been understood internally, the amendment formalises it as an RPT for company-law purposes. Without retrospective approval and disclosure before 31 May, your statutory auditor will have to qualify the FY2025-26 financials, and any Bharat Motors transactions executed without prior board approval are *voidable* at the company's option under Sec 188(3).

**What we need to do — by 31 May 2026:**
1. Convene a special board meeting to pass an **omnibus approval** under Sec 188(1) covering all 47 FY invoices
2. Audit committee ratification under Sec 177(4) — this needs careful structuring given the materiality
3. Full-year RPT disclosure in the board's report under Sec 188(2)
4. Update **Form MBP-4** (Sec 189 register)
5. Coordinate with the statutory auditor in advance to avoid an audit-qualification scenario

I would strongly suggest scheduling the board meeting **this week**. Given the materiality (78% of revenue), this is the single largest compliance item on Steelvine's books at the moment. We will prepare the omnibus resolution, audit-committee note, and a draft auditor briefing — please confirm a board date by 9 May so we can move.

Best regards,
Karan Kotai
For [Your firm name]`,
    channel: "email",
  },
};

// ─── 4. Factories Act × Astra (manufacturing — affected) ───────────────────
const FACT_ASTRA: ImpactCell = {
  circularNumber: "MOL/2026/FA-SHIFT-01",
  clientId: "client_astra",
  payload: {
    severity: "medium",
    summary:
      "Astra's formulations facility operates as a continuous-process unit and is directly affected by the Factories Act shift-hour amendment. Action required to obtain Chief Inspector approval and set up quarterly overtime reporting.",
    rationale:
      "Pharmaceutical formulations production qualifies as a continuous-process industry under the Factories Act 1948. The amendment permits maximum continuous shift hours to be raised from 9 to 10 with prior approval of the Chief Inspector of Factories, and mandates quarterly overtime accrual reporting. Astra's Hyderabad facility currently operates 9-hour shifts; the amendment is an opportunity (not an obligation) to extend, but quarterly overtime reporting is mandatory regardless of whether the extension is sought.",
    affectedTransactions: [],
    concentrationMetrics: null,
    totalAmount: 0,
    totalCount: 0,
  },
};

// ─── 5. Factories Act × Northwind (software — not affected) ────────────────
const FACT_NORTHWIND: ImpactCell = {
  circularNumber: "MOL/2026/FA-SHIFT-01",
  clientId: "client_northwind",
  payload: {
    severity: "not_affected",
    summary:
      "Northwind India is a software / SaaS company; the Factories Act 1948 does not apply to its operations.",
    rationale:
      "The Factories Act 1948 applies only to manufacturing premises with 10 or more workers using power (or 20 without power). Northwind India is registered as an IT/ITES company and does not operate any manufacturing premises within the Act's definitions. The amendment to shift-work hour limits does not affect this client.",
    affectedTransactions: [],
    concentrationMetrics: null,
    totalAmount: 0,
    totalCount: 0,
  },
};

// ─── 6. Factories Act × Steelvine (manufacturing — affected) ───────────────
const FACT_STEELVINE: ImpactCell = {
  circularNumber: "MOL/2026/FA-SHIFT-01",
  clientId: "client_steelvine",
  payload: {
    severity: "medium",
    summary:
      "Steelvine's auto-component plant is a continuous-process facility and falls within the amended provision. Quarterly overtime reporting is now mandatory.",
    rationale:
      "Steelvine's Pune tier-2 manufacturing operations are classified as continuous-process under the Factories Act 1948. The amendment introduces mandatory quarterly overtime accrual reporting and permits a 10-hour continuous shift cap with Chief Inspector approval. Steelvine has historically run 9-hour shifts; the operational decision is whether to apply for the extended cap, but the new quarterly reporting requirement applies regardless.",
    affectedTransactions: [],
    concentrationMetrics: null,
    totalAmount: 0,
    totalCount: 0,
  },
};

// ─── 7. CBDT 194Q × Astra (high procurement volume) ────────────────────────
const TDS194Q_ASTRA: ImpactCell = {
  circularNumber: "CBDT/2026/194Q-01",
  clientId: "client_astra",
  payload: {
    severity: "low",
    summary:
      "Astra's API procurement volume crosses the 194Q threshold; the clarification confirms the existing TDS treatment with a transitional 6-month relief on rate revisions.",
    rationale:
      "Astra's annual API procurement (~₹30 cr) exceeds the ₹50 lakh per-supplier threshold under Section 194Q. The clarification does not introduce new obligations but confirms transitional thresholds and provides 6 months of relief on any rate revisions. No immediate action required beyond confirming current TDS deductions are accurate.",
    affectedTransactions: [],
    concentrationMetrics: null,
    totalAmount: 0,
    totalCount: 0,
  },
};

// ─── 8. CBDT 194Q × Northwind (low procurement) ────────────────────────────
const TDS194Q_NORTHWIND: ImpactCell = {
  circularNumber: "CBDT/2026/194Q-01",
  clientId: "client_northwind",
  payload: {
    severity: "low",
    summary:
      "Northwind India's goods procurement is minimal (mostly hardware and office supplies) and well below the 194Q threshold. The clarification has no operational impact.",
    rationale:
      "As a SaaS / services-led business, Northwind India's purchases of goods (laptops, peripherals) are below the ₹50 lakh annual per-supplier threshold under Sec 194Q. The clarification on transitional thresholds does not require changes to the current TDS regime applied at this client.",
    affectedTransactions: [],
    concentrationMetrics: null,
    totalAmount: 0,
    totalCount: 0,
  },
};

// ─── 9. CBDT 194Q × Steelvine (low — sale-side, not purchase-side) ─────────
const TDS194Q_STEELVINE: ImpactCell = {
  circularNumber: "CBDT/2026/194Q-01",
  clientId: "client_steelvine",
  payload: {
    severity: "low",
    summary:
      "Steelvine is primarily on the sales side of the 194Q equation; Bharat Motors (the buyer) is responsible for the deduction. The clarification confirms the existing position.",
    rationale:
      "194Q places the deduction obligation on the buyer of goods, not the seller. Steelvine's procurement (steel, fasteners, packaging) is below the threshold. Bharat Motors, as the buyer of Steelvine's components, is the deductor and the clarification primarily affects them. Steelvine's role is to ensure Form 26AS reconciliation captures the credits correctly.",
    affectedTransactions: [],
    concentrationMetrics: null,
    totalAmount: 0,
    totalCount: 0,
  },
};

// ─── 10. Ind AS 115 × Astra ────────────────────────────────────────────────
const INDAS_ASTRA: ImpactCell = {
  circularNumber: "ICAI/2026/INDAS-115-01",
  clientId: "client_astra",
  payload: {
    severity: "low",
    summary:
      "Astra's revenue is point-of-sale formulations sales; Ind AS 115 application is straightforward and the bundled-contract guidance does not apply.",
    rationale:
      "Astra's business model is finished-formulations dispatch with no service overlay; revenue recognition under Ind AS 115 follows the simple control-transfer-on-dispatch pattern. The new EAC opinion on bundled service contracts addresses multi-element arrangements (typical in SaaS or licensing) and does not affect Astra's revenue presentation.",
    affectedTransactions: [],
    concentrationMetrics: null,
    totalAmount: 0,
    totalCount: 0,
  },
};

// ─── 11. Ind AS 115 × Northwind (SaaS — affected) ──────────────────────────
const INDAS_NORTHWIND: ImpactCell = {
  circularNumber: "ICAI/2026/INDAS-115-01",
  clientId: "client_northwind",
  payload: {
    severity: "high",
    summary:
      "Northwind's bundled SaaS contracts (platform license + implementation + support) require performance-obligation re-evaluation under the new ICAI EAC guidance. Revenue allocation across PObs may shift.",
    rationale:
      "Northwind's enterprise contracts typically bundle a platform subscription, an implementation service, and ongoing support into a single fee schedule. The new ICAI EAC opinion clarifies how to identify distinct performance obligations and allocate transaction price using standalone selling prices. Northwind's existing accounting policy treats the bundle as a single PO recognised over the subscription period; the new guidance suggests at least two PObs (subscription vs. implementation) with potentially material allocation shifts. Q4 financials should be drafted under the revised approach.",
    affectedTransactions: [],
    concentrationMetrics: null,
    totalAmount: 0,
    totalCount: 0,
  },
  comm: {
    subject: "Ind AS 115 — Performance-obligation re-evaluation for bundled SaaS contracts",
    body: `Dear Northwind India team,

The ICAI's Expert Advisory Committee has issued a new opinion (EAC 2026/04) on Ind AS 115 application for **bundled service contracts**. This is directly relevant to Northwind's enterprise contract structure.

**The change:** the EAC now positions implementation and support services in a SaaS bundle as **separately distinct performance obligations** rather than a single combined PO. This typically shifts revenue from the subscription period (deferred recognition) toward the implementation period (upfront recognition).

**For Northwind's Q4 financials:** we should re-evaluate the PObs in the larger enterprise contracts and re-test the standalone-selling-price allocation. There may be material recognition shifts compared to the current single-PO approach. The change is effective for FY2025-26.

**What we need to do — before Q4 close:**
1. Identify the top 5-10 bundled contracts by ARR
2. Decompose each into its distinct PObs (subscription, implementation, support)
3. Estimate standalone selling prices and re-allocate transaction price
4. Quantify the impact on revenue recognition timing
5. Document the policy change with audit-committee briefing

We can run the analysis on your top contracts in the next 2-3 weeks. Please share the top-customer revenue file and we will return the decomposition.

Best regards,
Karan Kotai
For [Your firm name]`,
    channel: "email",
  },
};

// ─── 12. Ind AS 115 × Steelvine (manufacturing — not affected) ─────────────
const INDAS_STEELVINE: ImpactCell = {
  circularNumber: "ICAI/2026/INDAS-115-01",
  clientId: "client_steelvine",
  payload: {
    severity: "not_affected",
    summary:
      "Steelvine's revenue is product-sale on dispatch; the new EAC opinion on bundled service contracts does not apply.",
    rationale:
      "Steelvine's revenue model is straightforward: components sold to OEMs with title and risk transferring on dispatch. Ind AS 115 application is single-PO and not affected by the new bundled-services EAC opinion. No change to the revenue recognition policy required.",
    affectedTransactions: [],
    concentrationMetrics: null,
    totalAmount: 0,
    totalCount: 0,
  },
};

// ─── 13. Gratuity ceiling × Astra ──────────────────────────────────────────
const GRAT_ASTRA: ImpactCell = {
  circularNumber: "EPFO/2026/GR-CEILING-01",
  clientId: "client_astra",
  payload: {
    severity: "low",
    summary:
      "Astra's gratuity provision needs a one-time recalculation against the revised wage ceiling. Modest balance-sheet impact expected.",
    rationale:
      "The Payment of Gratuity Act 1972 wage ceiling has been revised upward effective 1 June 2026. Astra has approximately 380 employees with 5+ years of service. The actuarial valuation for the year-end gratuity provision should be re-run with the new ceiling. Estimated provision increase: ~3-4% of current balance.",
    affectedTransactions: [],
    concentrationMetrics: null,
    totalAmount: 0,
    totalCount: 0,
  },
};

const GRAT_NORTHWIND: ImpactCell = {
  circularNumber: "EPFO/2026/GR-CEILING-01",
  clientId: "client_northwind",
  payload: {
    severity: "low",
    summary:
      "Northwind's gratuity provision is small (young employee base); ceiling revision has minor impact.",
    rationale:
      "Most of Northwind's ~85 employees have less than 5 years of service and thus do not yet qualify for gratuity. The ceiling revision affects only the senior cohort (~12 employees); actuarial recalculation can be done with year-end provisioning.",
    affectedTransactions: [],
    concentrationMetrics: null,
    totalAmount: 0,
    totalCount: 0,
  },
};

const GRAT_STEELVINE: ImpactCell = {
  circularNumber: "EPFO/2026/GR-CEILING-01",
  clientId: "client_steelvine",
  payload: {
    severity: "low",
    summary:
      "Steelvine has a tenured workforce; the gratuity ceiling revision is material to provisioning. Recommend immediate actuarial recalc.",
    rationale:
      "Steelvine has approximately 520 workers, many with 10+ years of service in a low-attrition manufacturing setting. The revised ceiling will increase the gratuity provision noticeably (~5-7%). Given Steelvine already has a sizeable balance-sheet provision in this account, the recalculation should be prioritised before the next quarterly close.",
    affectedTransactions: [],
    concentrationMetrics: null,
    totalAmount: 0,
    totalCount: 0,
  },
};

// ─── 14. GSTR-9 Table 17 × Astra ───────────────────────────────────────────
const GSTR9_ASTRA: ImpactCell = {
  circularNumber: "GSTN/2026/GSTR9-01",
  clientId: "client_astra",
  payload: {
    severity: "medium",
    summary:
      "Astra's GSTR-9 for FY2025-26 must include new Table 17 fields covering related-party transactions. Helix concentration triggers reporting.",
    rationale:
      "The amended GSTR-9 format introduces fields in Table 17 for inward-supply RPT reporting. Astra's Helix Chemicals position (47% concentration, now an RPT under amended Sec 188) maps to this new disclosure. The data is the same as the company-law disclosure but in GST-tabular format with HSN-level breakdowns. Coordinate with the team handling the Sec 188 disclosure to ensure consistency.",
    affectedTransactions: [],
    concentrationMetrics: null,
    totalAmount: 0,
    totalCount: 0,
  },
};

const GSTR9_NORTHWIND: ImpactCell = {
  circularNumber: "GSTN/2026/GSTR9-01",
  clientId: "client_northwind",
  payload: {
    severity: "medium",
    summary:
      "Northwind's GSTR-9 needs Table 17 disclosure for parent-group invoices; align with Sec 188 and Form 3CEB methodology.",
    rationale:
      "The new Table 17 of GSTR-9 captures outward-supply RPT data. Northwind's invoices to Northwind Inc Group (38% revenue concentration) are reportable here. Methodology must be consistent with the Sec 188 disclosure and the Form 3CEB transfer-pricing report. Single tabulation supports all three filings.",
    affectedTransactions: [],
    concentrationMetrics: null,
    totalAmount: 0,
    totalCount: 0,
  },
};

const GSTR9_STEELVINE: ImpactCell = {
  circularNumber: "GSTN/2026/GSTR9-01",
  clientId: "client_steelvine",
  payload: {
    severity: "high",
    summary:
      "Steelvine's GSTR-9 RPT disclosure (Table 17) is significant given the Bharat Motors concentration. Volume of detail (47 invoices) requires careful aggregation.",
    rationale:
      "Steelvine's outward supplies to Bharat Motors (78% revenue) populate Table 17 in detail. With 47 invoices to disclose, the aggregation needs HSN-wise totals plus invoice-level support file. Format is now stricter than prior years and the GSTN portal will reject inconsistent totals — pre-validate before submission.",
    affectedTransactions: [],
    concentrationMetrics: null,
    totalAmount: 0,
    totalCount: 0,
  },
};

// ─── Index ─────────────────────────────────────────────────────────────────
export const IMPACT_CELLS: ImpactCell[] = [
  LIVE_DROP_ASTRA, LIVE_DROP_NORTHWIND, LIVE_DROP_STEELVINE,
  FACT_ASTRA, FACT_NORTHWIND, FACT_STEELVINE,
  TDS194Q_ASTRA, TDS194Q_NORTHWIND, TDS194Q_STEELVINE,
  INDAS_ASTRA, INDAS_NORTHWIND, INDAS_STEELVINE,
  GRAT_ASTRA, GRAT_NORTHWIND, GRAT_STEELVINE,
  GSTR9_ASTRA, GSTR9_NORTHWIND, GSTR9_STEELVINE,
];

export function findImpactCell(circularNumber: string, clientId: string): ImpactCell | undefined {
  return IMPACT_CELLS.find(
    (c) => c.circularNumber === circularNumber && c.clientId === clientId,
  );
}

// Export keyed lookup for completeness
export const IMPACT_CELL_INDEX: Map<CellKey, ImpactCell> = new Map(
  IMPACT_CELLS.map((c) => [`${c.circularNumber}__${c.clientId}` as CellKey, c]),
);
