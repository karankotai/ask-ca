import { prisma } from "../src/lib/prisma";
import {
  CLIENTS,
  COUNTERPARTIES,
  TRANSACTIONS,
  CIRCULARS,
} from "../src/lib/demo/cast";

async function main() {
  console.log("[seed] Wiping previous demo data...");
  await prisma.draftComm.deleteMany({});
  await prisma.complianceItem.deleteMany({});
  await prisma.impactAnalysis.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.counterparty.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.scrapedDocument.deleteMany({ where: { crawler: "demo" } });

  console.log("[seed] Inserting clients...");
  for (const c of CLIENTS) {
    await prisma.client.create({ data: c });
  }

  console.log("[seed] Inserting counterparties...");
  for (const cp of COUNTERPARTIES) {
    await prisma.counterparty.create({ data: cp });
  }

  console.log("[seed] Inserting transactions...");
  for (const t of TRANSACTIONS) {
    await prisma.transaction.create({
      data: { ...t, date: new Date(t.date) },
    });
  }

  console.log("[seed] Inserting circulars...");
  for (const ci of CIRCULARS) {
    await prisma.scrapedDocument.create({
      data: {
        source: ci.source,
        crawler: ci.crawler,
        title: ci.title,
        date: ci.date,
        department: ci.department,
        link: ci.link,
        details: ci.details,
        content: ci.content,
        circularNumber: ci.circularNumber,
        affectedActs: ci.affectedActs,
        severity: ci.severity,
        deadlineDays: ci.deadlineDays ?? null,
        releasedAt: ci.releasedAt ? new Date(ci.releasedAt) : null,
        isLiveDrop: ci.isLiveDrop,
        aiSummary: ci.aiSummary,
      },
    });
  }

  console.log("[seed] Inserting baseline compliance items...");

  // Steelvine — heaviest red flag
  await prisma.complianceItem.create({
    data: {
      clientId: "client_steelvine",
      actName: "Companies Act 2013",
      actionRequired: "Annual return MGT-7 filing",
      dueDate: new Date("2026-05-30"),
      status: "pending",
      severity: "critical",
    },
  });
  await prisma.complianceItem.create({
    data: {
      clientId: "client_steelvine",
      actName: "Income Tax Act 1961",
      actionRequired: "Quarterly TDS return — Q4 FY26",
      dueDate: new Date("2026-05-15"),
      status: "in_progress",
      severity: "high",
    },
  });
  await prisma.complianceItem.create({
    data: {
      clientId: "client_steelvine",
      actName: "Factories Act 1948",
      actionRequired: "Half-yearly Form 21 return",
      dueDate: new Date("2026-05-20"),
      status: "pending",
      severity: "medium",
    },
  });

  // Astra — high-severity item so it counts as flagged
  await prisma.complianceItem.create({
    data: {
      clientId: "client_astra",
      actName: "Drugs and Cosmetics Act 1940",
      actionRequired: "Schedule M renewal — facility audit",
      dueDate: new Date("2026-05-25"),
      status: "pending",
      severity: "high",
    },
  });
  await prisma.complianceItem.create({
    data: {
      clientId: "client_astra",
      actName: "EPF & MP Act 1952",
      actionRequired: "PF return filing — April 2026",
      dueDate: new Date("2026-05-15"),
      status: "pending",
      severity: "medium",
    },
  });
  await prisma.complianceItem.create({
    data: {
      clientId: "client_astra",
      actName: "Income Tax Act 1961",
      actionRequired: "Advance tax — Q1 FY26",
      dueDate: new Date("2026-06-15"),
      status: "pending",
      severity: "low",
    },
  });

  // Northwind — high-severity item so it counts as flagged
  await prisma.complianceItem.create({
    data: {
      clientId: "client_northwind",
      actName: "Income Tax Act 1961",
      actionRequired: "Form 3CEB — transfer pricing report",
      dueDate: new Date("2026-05-28"),
      status: "pending",
      severity: "high",
    },
  });
  await prisma.complianceItem.create({
    data: {
      clientId: "client_northwind",
      actName: "Companies Act 2013",
      actionRequired: "Board meeting minutes — Q4",
      dueDate: new Date("2026-04-30"),
      status: "done",
      severity: "low",
    },
  });
  await prisma.complianceItem.create({
    data: {
      clientId: "client_northwind",
      actName: "GST Act 2017",
      actionRequired: "GSTR-3B reconciliation — March",
      dueDate: new Date("2026-05-20"),
      status: "in_progress",
      severity: "medium",
    },
  });
  await prisma.complianceItem.create({
    data: {
      clientId: "client_northwind",
      actName: "Foreign Exchange Management Act",
      actionRequired: "FLA return — annual filing",
      dueDate: new Date("2026-07-15"),
      status: "pending",
      severity: "low",
    },
  });

  const counts = {
    clients: await prisma.client.count(),
    counterparties: await prisma.counterparty.count(),
    transactions: await prisma.transaction.count(),
    circulars: await prisma.scrapedDocument.count({ where: { crawler: "demo" } }),
    items: await prisma.complianceItem.count(),
  };
  console.log("[seed] Done. Counts:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
