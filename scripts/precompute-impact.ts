// "Precompute" used to run Anthropic offline for each (circular × client) pair.
// We now load pre-curated payloads from src/lib/demo/impact-payloads.ts and
// insert them directly. This is the same architecture as the offline-AI flow —
// just authored inline rather than via a one-shot API call. The validators
// from src/lib/impact/validate.ts and the Zod schema still gate every payload
// before it lands in the DB, so the integrity guarantees are unchanged.

import { prisma } from "../src/lib/prisma";
import { IMPACT_CELLS } from "../src/lib/demo/impact-payloads";
import { ImpactAnalysisPayloadSchema } from "../src/lib/impact/schema";
import { validateTransactionIds } from "../src/lib/impact/validate";

async function main() {
  console.log("[precompute] Loading clients, circulars, and transactions...");
  const clients = await prisma.client.findMany();
  const circulars = await prisma.scrapedDocument.findMany({
    where: { crawler: "demo" },
    select: { id: true, circularNumber: true, title: true },
  });
  const transactions = await prisma.transaction.findMany({
    select: { id: true, clientId: true },
  });

  const transactionsByClient = new Map<string, Set<string>>();
  for (const t of transactions) {
    const set = transactionsByClient.get(t.clientId) ?? new Set<string>();
    set.add(t.id);
    transactionsByClient.set(t.clientId, set);
  }

  const clientById = new Map(clients.map((c) => [c.id, c]));
  const circularByNumber = new Map(circulars.map((c) => [c.circularNumber, c]));

  console.log("[precompute] Wiping previous analyses and comms...");
  await prisma.draftComm.deleteMany({});
  await prisma.impactAnalysis.deleteMany({});

  let okCount = 0;
  let skippedCount = 0;
  let commCount = 0;

  for (const cell of IMPACT_CELLS) {
    const client = clientById.get(cell.clientId);
    const circular = circularByNumber.get(cell.circularNumber);

    if (!client) {
      console.warn(`[precompute] Skipping cell — client not found: ${cell.clientId}`);
      skippedCount++;
      continue;
    }
    if (!circular) {
      console.warn(`[precompute] Skipping cell — circular not found: ${cell.circularNumber}`);
      skippedCount++;
      continue;
    }

    // Validate the payload against the Zod schema
    const schemaResult = ImpactAnalysisPayloadSchema.safeParse(cell.payload);
    if (!schemaResult.success) {
      console.error(`[precompute] Schema FAILED for ${cell.circularNumber} × ${client.name}:`, schemaResult.error.message);
      skippedCount++;
      continue;
    }

    // Validate transaction IDs
    const validIds = transactionsByClient.get(cell.clientId) ?? new Set<string>();
    const txnResult = validateTransactionIds(schemaResult.data, validIds);
    if (txnResult.ok === false) {
      console.error(`[precompute] Transaction-ID FAILED for ${cell.circularNumber} × ${client.name}:`, txnResult.missingIds);
      skippedCount++;
      continue;
    }

    await prisma.impactAnalysis.create({
      data: {
        circularId: circular.id,
        clientId: client.id,
        payload: schemaResult.data as object,
        validatedAt: new Date(),
      },
    });
    okCount++;
    console.log(`  ✓ ${cell.circularNumber} × ${client.name} (severity=${schemaResult.data.severity}, count=${schemaResult.data.totalCount})`);

    if (cell.comm) {
      await prisma.draftComm.create({
        data: {
          circularId: circular.id,
          clientId: client.id,
          subject: cell.comm.subject,
          body: cell.comm.body,
          channel: cell.comm.channel,
          status: "draft",
        },
      });
      commCount++;
    }
  }

  console.log(`[precompute] Done. Inserted: ${okCount} ImpactAnalysis, ${commCount} DraftComm. Skipped: ${skippedCount}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
