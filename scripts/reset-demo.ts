import { prisma } from "../src/lib/prisma";

export async function resetDemoState() {
  // 1. Pull live-drop circular's releasedAt back to far future
  await prisma.scrapedDocument.updateMany({
    where: { isLiveDrop: true },
    data: { releasedAt: new Date("3000-01-01T00:00:00.000Z") },
  });

  // 2. Remove ComplianceItem rows that reference any live-drop circular
  const liveDrops = await prisma.scrapedDocument.findMany({
    where: { isLiveDrop: true },
    select: { id: true },
  });
  const liveDropIds = liveDrops.map((c) => c.id);
  if (liveDropIds.length > 0) {
    await prisma.complianceItem.deleteMany({
      where: { circularId: { in: liveDropIds } },
    });
  }

  // 3. Reset DraftComm rows that were marked "saved" or "sent" back to "draft"
  await prisma.draftComm.updateMany({
    where: { status: { in: ["saved", "sent"] } },
    data: { status: "draft" },
  });

  // 4. Reset the closing-move ComplianceItem (PF return - Astra) back to pending if it was toggled
  await prisma.complianceItem.updateMany({
    where: {
      clientId: "client_astra",
      actionRequired: "PF return filing — April 2026",
    },
    data: { status: "pending" },
  });
}

if (require.main === module) {
  resetDemoState()
    .then(() => console.log("[reset] Demo state restored to baseline."))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
