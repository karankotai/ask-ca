-- AlterTable
ALTER TABLE "scraped_documents" ADD COLUMN     "affected_acts" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "ai_summary" TEXT,
ADD COLUMN     "deadline_days" INTEGER,
ADD COLUMN     "is_live_drop" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "released_at" TIMESTAMPTZ(6),
ADD COLUMN     "severity" TEXT;

-- CreateTable
CREATE TABLE "demo_clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "turnoverCr" DOUBLE PRECISION NOT NULL,
    "ownership" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postureBadge" TEXT NOT NULL DEFAULT 'LOW_RISK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_counterparties" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "concentrationPct" DOUBLE PRECISION NOT NULL,
    "isFormallyRelated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "demo_counterparties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_transactions" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "counterpartyId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "demo_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_impact_analyses" (
    "id" TEXT NOT NULL,
    "circularId" INTEGER NOT NULL,
    "clientId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "lastComputedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3),

    CONSTRAINT "demo_impact_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_compliance_items" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "circularId" INTEGER,
    "actName" TEXT NOT NULL,
    "actionRequired" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_compliance_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_draft_comms" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "circularId" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_draft_comms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demo_counterparties_clientId_idx" ON "demo_counterparties"("clientId");

-- CreateIndex
CREATE INDEX "demo_transactions_clientId_idx" ON "demo_transactions"("clientId");

-- CreateIndex
CREATE INDEX "demo_transactions_counterpartyId_idx" ON "demo_transactions"("counterpartyId");

-- CreateIndex
CREATE INDEX "demo_impact_analyses_circularId_idx" ON "demo_impact_analyses"("circularId");

-- CreateIndex
CREATE UNIQUE INDEX "demo_impact_analyses_circularId_clientId_key" ON "demo_impact_analyses"("circularId", "clientId");

-- CreateIndex
CREATE INDEX "demo_compliance_items_clientId_idx" ON "demo_compliance_items"("clientId");

-- CreateIndex
CREATE INDEX "demo_compliance_items_dueDate_idx" ON "demo_compliance_items"("dueDate");

-- CreateIndex
CREATE INDEX "demo_draft_comms_clientId_idx" ON "demo_draft_comms"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "demo_draft_comms_circularId_clientId_key" ON "demo_draft_comms"("circularId", "clientId");

-- AddForeignKey
ALTER TABLE "demo_counterparties" ADD CONSTRAINT "demo_counterparties_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "demo_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_transactions" ADD CONSTRAINT "demo_transactions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "demo_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_transactions" ADD CONSTRAINT "demo_transactions_counterpartyId_fkey" FOREIGN KEY ("counterpartyId") REFERENCES "demo_counterparties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_impact_analyses" ADD CONSTRAINT "demo_impact_analyses_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "demo_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_impact_analyses" ADD CONSTRAINT "demo_impact_analyses_circularId_fkey" FOREIGN KEY ("circularId") REFERENCES "scraped_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_compliance_items" ADD CONSTRAINT "demo_compliance_items_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "demo_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_compliance_items" ADD CONSTRAINT "demo_compliance_items_circularId_fkey" FOREIGN KEY ("circularId") REFERENCES "scraped_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_draft_comms" ADD CONSTRAINT "demo_draft_comms_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "demo_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_draft_comms" ADD CONSTRAINT "demo_draft_comms_circularId_fkey" FOREIGN KEY ("circularId") REFERENCES "scraped_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

