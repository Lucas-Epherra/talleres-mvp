-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "receipt_number" INTEGER NOT NULL,
    "issued_by_user_id" TEXT,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_snapshot" JSONB NOT NULL,
    "vehicle_snapshot" JSONB NOT NULL,
    "work_snapshot" JSONB NOT NULL,
    "labor_cost" DECIMAL(12,2),
    "parts_cost" DECIMAL(12,2),
    "total" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "email_to" TEXT,
    "emailed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "receipts_workshop_id_idx" ON "receipts"("workshop_id");

-- CreateIndex
CREATE INDEX "receipts_work_order_id_idx" ON "receipts"("work_order_id");

-- CreateIndex
CREATE INDEX "receipts_issued_by_user_id_idx" ON "receipts"("issued_by_user_id");

-- CreateIndex
CREATE INDEX "receipts_issued_at_idx" ON "receipts"("issued_at");

-- CreateIndex
CREATE INDEX "receipts_emailed_at_idx" ON "receipts"("emailed_at");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_workshop_id_receipt_number_key" ON "receipts"("workshop_id", "receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_workshop_id_work_order_id_key" ON "receipts"("workshop_id", "work_order_id");

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_issued_by_user_id_fkey" FOREIGN KEY ("issued_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
