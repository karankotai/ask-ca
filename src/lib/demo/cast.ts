// Single source of truth for demo data. Tune numbers here, not in seed scripts.
//
// Numbers reconcile across spec:
//   Astra: 12 transactions × ~₹1.18 cr avg = ₹14.2 cr (Helix 47%)
//   Northwind: 4 transactions × ~₹1.525 cr avg = ₹6.1 cr (Parent 38%)
//   Steelvine: 47 transactions × ~₹1.04 cr avg = ₹49 cr (OEM 78%)
//   Total exposure: ₹69.3 cr → displayed as "₹70 cr"

export type ClientSeed = {
  id: string;
  name: string;
  sector: string;
  turnoverCr: number;
  ownership: string;
  city: string;
  postureBadge: "HIGH_RISK" | "MEDIUM_RISK" | "LOW_RISK";
};

export type CounterpartySeed = {
  id: string;
  clientId: string;
  name: string;
  type: "vendor" | "customer";
  concentrationPct: number;
  isFormallyRelated: boolean;
};

export type TransactionSeed = {
  id: string;
  clientId: string;
  counterpartyId: string;
  invoiceNumber: string;
  amount: number;
  date: string;
  type: "purchase" | "sale";
  description: string;
};

export type CircularSeed = {
  source: string;
  crawler: string;
  title: string;
  date: string;
  department: string;
  link: string;
  details: string;
  content: string;
  circularNumber: string;
  affectedActs: string[];
  severity: string;
  deadlineDays: number | null;
  releasedAt: string | null;
  isLiveDrop: boolean;
  aiSummary: string;
};

export const CLIENTS: ClientSeed[] = [
  {
    id: "client_astra",
    name: "Astra Formulations Pvt Ltd",
    sector: "pharma",
    turnoverCr: 120,
    ownership: "founder-owned, single promoter",
    city: "Hyderabad",
    postureBadge: "MEDIUM_RISK",
  },
  {
    id: "client_northwind",
    name: "Northwind Tech India Pvt Ltd",
    sector: "software",
    turnoverCr: 40,
    ownership: "Indian subsidiary of Northwind Inc (US parent)",
    city: "Bangalore",
    postureBadge: "MEDIUM_RISK",
  },
  {
    id: "client_steelvine",
    name: "Steelvine Auto Components",
    sector: "auto-ancillary",
    turnoverCr: 250,
    ownership: "family-owned (founder + 2 sons), unlisted",
    city: "Pune",
    postureBadge: "HIGH_RISK",
  },
];

export const COUNTERPARTIES: CounterpartySeed[] = [
  { id: "cp_helix", clientId: "client_astra", name: "Helix Chemicals Pvt Ltd", type: "vendor", concentrationPct: 47, isFormallyRelated: false },
  { id: "cp_pharma_other_1", clientId: "client_astra", name: "Krishna Bulk Drugs", type: "vendor", concentrationPct: 18, isFormallyRelated: false },
  { id: "cp_pharma_other_2", clientId: "client_astra", name: "Citadel Lifesciences", type: "vendor", concentrationPct: 12, isFormallyRelated: false },
  { id: "cp_pharma_other_3", clientId: "client_astra", name: "Sundara Excipients", type: "vendor", concentrationPct: 8, isFormallyRelated: false },
  { id: "cp_parent", clientId: "client_northwind", name: "Northwind Inc Group", type: "customer", concentrationPct: 38, isFormallyRelated: false },
  { id: "cp_sw_cust_1", clientId: "client_northwind", name: "Acme Retail (US)", type: "customer", concentrationPct: 22, isFormallyRelated: false },
  { id: "cp_sw_cust_2", clientId: "client_northwind", name: "Globex APAC", type: "customer", concentrationPct: 14, isFormallyRelated: false },
  { id: "cp_oem", clientId: "client_steelvine", name: "Bharat Motors Ltd", type: "customer", concentrationPct: 78, isFormallyRelated: false },
  { id: "cp_auto_cust_1", clientId: "client_steelvine", name: "Spareco Distribution", type: "customer", concentrationPct: 12, isFormallyRelated: false },
];

export const ASTRA_HELIX_TXNS: TransactionSeed[] = [
  { id: "txn_astra_4521", clientId: "client_astra", counterpartyId: "cp_helix", invoiceNumber: "INV-4521", amount: 14_200_000, date: "2026-04-14", type: "purchase", description: "API supply — Atorvastatin Q4 batch" },
  { id: "txn_astra_4498", clientId: "client_astra", counterpartyId: "cp_helix", invoiceNumber: "INV-4498", amount: 12_800_000, date: "2026-03-28", type: "purchase", description: "API supply — Atorvastatin Q4 batch" },
  { id: "txn_astra_4471", clientId: "client_astra", counterpartyId: "cp_helix", invoiceNumber: "INV-4471", amount: 11_500_000, date: "2026-03-12", type: "purchase", description: "API supply — Atorvastatin Q4 batch" },
  { id: "txn_astra_4452", clientId: "client_astra", counterpartyId: "cp_helix", invoiceNumber: "INV-4452", amount: 13_400_000, date: "2026-02-26", type: "purchase", description: "API supply — Metformin batch" },
  { id: "txn_astra_4438", clientId: "client_astra", counterpartyId: "cp_helix", invoiceNumber: "INV-4438", amount: 10_900_000, date: "2026-02-14", type: "purchase", description: "API supply — Metformin batch" },
  { id: "txn_astra_4419", clientId: "client_astra", counterpartyId: "cp_helix", invoiceNumber: "INV-4419", amount: 12_100_000, date: "2026-01-30", type: "purchase", description: "API supply — Atorvastatin batch" },
  { id: "txn_astra_4402", clientId: "client_astra", counterpartyId: "cp_helix", invoiceNumber: "INV-4402", amount: 11_700_000, date: "2026-01-15", type: "purchase", description: "API supply — Metformin batch" },
  { id: "txn_astra_4388", clientId: "client_astra", counterpartyId: "cp_helix", invoiceNumber: "INV-4388", amount: 12_900_000, date: "2025-12-30", type: "purchase", description: "API supply — Atorvastatin batch" },
  { id: "txn_astra_4371", clientId: "client_astra", counterpartyId: "cp_helix", invoiceNumber: "INV-4371", amount: 10_500_000, date: "2025-12-14", type: "purchase", description: "API supply — Metformin batch" },
  { id: "txn_astra_4358", clientId: "client_astra", counterpartyId: "cp_helix", invoiceNumber: "INV-4358", amount: 11_200_000, date: "2025-11-28", type: "purchase", description: "API supply — Atorvastatin batch" },
  { id: "txn_astra_4342", clientId: "client_astra", counterpartyId: "cp_helix", invoiceNumber: "INV-4342", amount: 10_800_000, date: "2025-11-12", type: "purchase", description: "API supply — Metformin batch" },
  { id: "txn_astra_4327", clientId: "client_astra", counterpartyId: "cp_helix", invoiceNumber: "INV-4327", amount: 10_000_000, date: "2025-10-28", type: "purchase", description: "API supply — Atorvastatin batch" },
];

export const NORTHWIND_PARENT_TXNS: TransactionSeed[] = [
  { id: "txn_nw_2891", clientId: "client_northwind", counterpartyId: "cp_parent", invoiceNumber: "SI-2891", amount: 18_000_000, date: "2026-04-22", type: "sale", description: "Q4 platform license to parent group" },
  { id: "txn_nw_2854", clientId: "client_northwind", counterpartyId: "cp_parent", invoiceNumber: "SI-2854", amount: 16_500_000, date: "2026-03-22", type: "sale", description: "Q3 platform license to parent group" },
  { id: "txn_nw_2818", clientId: "client_northwind", counterpartyId: "cp_parent", invoiceNumber: "SI-2818", amount: 14_000_000, date: "2026-02-22", type: "sale", description: "Q2 platform license to parent group" },
  { id: "txn_nw_2782", clientId: "client_northwind", counterpartyId: "cp_parent", invoiceNumber: "SI-2782", amount: 12_500_000, date: "2026-01-22", type: "sale", description: "Q1 platform license to parent group" },
];

function generateSteelvineTxns(): TransactionSeed[] {
  const txns: TransactionSeed[] = [];
  const startDate = new Date("2025-04-01");
  for (let i = 0; i < 47; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i * 7);
    txns.push({
      id: `txn_sv_${1000 + i}`,
      clientId: "client_steelvine",
      counterpartyId: "cp_oem",
      invoiceNumber: `SV-${1000 + i}`,
      amount: 8_500_000 + (i % 7) * 600_000,
      date: d.toISOString().slice(0, 10),
      type: "sale",
      description: "Tier-2 component supply — weekly delivery to OEM",
    });
  }
  return txns;
}
export const STEELVINE_OEM_TXNS = generateSteelvineTxns();

export const TRANSACTIONS: TransactionSeed[] = [
  ...ASTRA_HELIX_TXNS,
  ...NORTHWIND_PARENT_TXNS,
  ...STEELVINE_OEM_TXNS,
];

const FAR_FUTURE = "3000-01-01T00:00:00.000Z";

export const CIRCULARS: CircularSeed[] = [
  {
    source: "MCA",
    crawler: "demo",
    title: "Amendment to Section 188 — Economic-Dependence Test for Related-Party Classification",
    date: "2026-05-06",
    department: "Ministry of Corporate Affairs",
    link: "https://www.mca.gov.in/demo/sec188-economic-dependence",
    details: "Notification G.S.R. 312(E)",
    content: "The Companies Act 2013 Section 188 is amended to introduce an economic-dependence test for related-party classification. Any vendor providing more than 40% of a category-level supply, or any customer providing more than 30% of total revenue, is to be classified as a related party irrespective of equity linkage. Disclosure under sub-section (2) is required for all transactions with such parties for the current FY. Retrospective board approval and audit committee ratification are required by 31 May 2026.",
    circularNumber: "MCA/2026/188-AMD-01",
    affectedActs: ["Companies Act 2013"],
    severity: "high",
    deadlineDays: 25,
    releasedAt: FAR_FUTURE,
    isLiveDrop: true,
    aiSummary: "Companies Act Sec 188 now uses an economic-dependence test (>40% supply / >30% revenue) to classify related parties, even without equity linkage. Retrospective disclosure required by 31 May 2026.",
  },
  {
    source: "Min. of Labour",
    crawler: "demo",
    title: "Factories Act 1948 — Amendment to Shift-Work Hour Limits in Continuous-Process Industries",
    date: "2026-05-02",
    department: "Ministry of Labour and Employment",
    link: "https://labour.gov.in/demo/factories-1948-shift",
    details: "S.O. 1872(E)",
    content: "The Factories Act 1948 is amended to revise maximum continuous shift hours from 9 to 10 in continuous-process industries with prior approval of the Chief Inspector of Factories. Quarterly reporting on overtime accrual is now mandatory.",
    circularNumber: "MOL/2026/FA-SHIFT-01",
    affectedActs: ["Factories Act 1948"],
    severity: "medium",
    deadlineDays: 60,
    releasedAt: "2026-05-02T00:00:00.000Z",
    isLiveDrop: false,
    aiSummary: "Factories Act 1948 raises continuous-shift cap from 9 to 10 hours in continuous-process industries with Chief Inspector approval. Quarterly overtime reports now mandatory.",
  },
  {
    source: "CBDT",
    crawler: "demo",
    title: "Section 194Q — Clarification on TDS Applicability for Goods Procurement",
    date: "2026-04-28",
    department: "Central Board of Direct Taxes",
    link: "https://incometaxindia.gov.in/demo/194q-clarification",
    details: "Circular No. 11/2026",
    content: "Clarification on the applicability of TDS u/s 194Q to high-volume goods procurement, specifying transitional thresholds.",
    circularNumber: "CBDT/2026/194Q-01",
    affectedActs: ["Income Tax Act 1961"],
    severity: "low",
    deadlineDays: 90,
    releasedAt: "2026-04-28T00:00:00.000Z",
    isLiveDrop: false,
    aiSummary: "Clarifies 194Q TDS thresholds for high-volume procurement; transitional 6-month relief noted.",
  },
  {
    source: "ICAI",
    crawler: "demo",
    title: "Ind AS 115 — Application Guidance on Bundled Service Contracts",
    date: "2026-04-25",
    department: "Institute of Chartered Accountants of India",
    link: "https://icai.org/demo/ind-as-115-bundled",
    details: "EAC Opinion 2026/04",
    content: "Application guidance on revenue recognition for bundled service contracts under Ind AS 115, focusing on performance-obligation identification.",
    circularNumber: "ICAI/2026/INDAS-115-01",
    affectedActs: ["Companies (Indian Accounting Standards) Rules"],
    severity: "medium",
    deadlineDays: 60,
    releasedAt: "2026-04-25T00:00:00.000Z",
    isLiveDrop: false,
    aiSummary: "Ind AS 115 guidance: performance-obligation tests for bundled service contracts. Affects SaaS / multi-element revenue.",
  },
  {
    source: "EPFO",
    crawler: "demo",
    title: "Payment of Gratuity Act — Revised Wage Ceiling for Non-Government Employees",
    date: "2026-04-20",
    department: "EPFO",
    link: "https://epfindia.gov.in/demo/gratuity-ceiling-2026",
    details: "Notification No. 28",
    content: "Wage ceiling for gratuity computation under the Payment of Gratuity Act 1972 is revised upward effective 1 June 2026.",
    circularNumber: "EPFO/2026/GR-CEILING-01",
    affectedActs: ["Payment of Gratuity Act 1972"],
    severity: "low",
    deadlineDays: 45,
    releasedAt: "2026-04-20T00:00:00.000Z",
    isLiveDrop: false,
    aiSummary: "Gratuity wage ceiling revised upward from 1 June 2026; affects payroll provisioning.",
  },
  {
    source: "GSTN",
    crawler: "demo",
    title: "GSTR-9 Filing — Extended Due Date and Format Updates",
    date: "2026-04-15",
    department: "Goods and Services Tax Network",
    link: "https://gst.gov.in/demo/gstr9-2026",
    details: "Notification No. 12/2026",
    content: "GSTR-9 due date extended; new fields added to Table 17 for related-party reporting.",
    circularNumber: "GSTN/2026/GSTR9-01",
    affectedActs: ["Central Goods and Services Tax Act 2017"],
    severity: "medium",
    deadlineDays: 90,
    releasedAt: "2026-04-15T00:00:00.000Z",
    isLiveDrop: false,
    aiSummary: "GSTR-9 due date extended; new related-party reporting fields in Table 17.",
  },
];
