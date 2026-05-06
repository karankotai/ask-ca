import { prisma } from "../src/lib/prisma";
import { runImpactAnalysis } from "../src/lib/impact/run";
import { runCommDraft } from "../src/lib/impact/run-comm";

async function main() {
  console.log("[precompute] Loading clients and circulars...");
  const clients = await prisma.client.findMany({
    include: { counterparties: true, transactions: { include: { counterparty: true } } },
  });
  const circulars = await prisma.scrapedDocument.findMany({
    where: { crawler: "demo" },
  });

  console.log(`[precompute] ${clients.length} clients × ${circulars.length} circulars = ${clients.length * circulars.length} pairs`);

  await prisma.draftComm.deleteMany({});
  await prisma.impactAnalysis.deleteMany({});

  for (const circular of circulars) {
    for (const client of clients) {
      console.log(`[precompute] Impact: ${circular.title.slice(0, 40)}... × ${client.name}`);

      const validTxnIds = new Set(client.transactions.map((t) => t.id));
      const txnsForPrompt = client.transactions.map((t) => ({
        id: t.id,
        invoiceNumber: t.invoiceNumber,
        amount: t.amount,
        date: t.date.toISOString().slice(0, 10),
        type: t.type as "purchase" | "sale",
        description: t.description,
        counterpartyName: t.counterparty.name,
      }));

      const cpsForPrompt = client.counterparties.map((c) => ({
        name: c.name,
        type: c.type as "vendor" | "customer",
        concentrationPct: c.concentrationPct,
        isFormallyRelated: c.isFormallyRelated,
      }));

      try {
        const impact = await runImpactAnalysis({
          circular: {
            title: circular.title,
            source: circular.source,
            date: circular.date,
            content: circular.content,
            affectedActs: circular.affectedActs,
          },
          client: {
            id: client.id,
            name: client.name,
            sector: client.sector,
            turnoverCr: client.turnoverCr,
            ownership: client.ownership,
            city: client.city,
          },
          counterparties: cpsForPrompt,
          transactions: txnsForPrompt,
          validTransactionIds: validTxnIds,
        });

        await prisma.impactAnalysis.create({
          data: {
            circularId: circular.id,
            clientId: client.id,
            payload: impact as object,
            validatedAt: new Date(),
          },
        });

        console.log(`  ✓ Impact stored. Severity=${impact.severity}, count=${impact.totalCount}`);

        if (impact.severity === "not_affected") {
          console.log(`  - Skipping comm (not_affected)`);
          continue;
        }

        const deadline = circular.deadlineDays
          ? new Date(Date.now() + circular.deadlineDays * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
          : "as soon as practicable";

        const comm = await runCommDraft({
          circular: {
            title: circular.title,
            source: circular.source,
            date: circular.date,
            content: circular.content,
            affectedActs: circular.affectedActs,
          },
          client: {
            id: client.id,
            name: client.name,
            sector: client.sector,
            turnoverCr: client.turnoverCr,
            ownership: client.ownership,
            city: client.city,
          },
          impactSummary: impact.summary,
          impactRationale: impact.rationale,
          affectedCount: impact.totalCount,
          totalAmount: impact.totalAmount,
          deadline,
        });

        await prisma.draftComm.create({
          data: {
            circularId: circular.id,
            clientId: client.id,
            subject: comm.subject,
            body: comm.body,
            channel: comm.channel,
            status: "draft",
          },
        });
        console.log(`  ✓ Comm stored.`);
      } catch (e) {
        console.error(`  ✗ FAILED:`, e);
      }
    }
  }

  const counts = {
    impactAnalyses: await prisma.impactAnalysis.count(),
    draftComms: await prisma.draftComm.count(),
  };
  console.log("[precompute] Done. Counts:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
