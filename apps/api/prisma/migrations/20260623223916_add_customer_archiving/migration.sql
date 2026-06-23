-- CreateEnum
CREATE TYPE "CustomerEventType" AS ENUM ('ARCHIVED', 'RESTORED');

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "archived_at" TIMESTAMP(3),
ADD COLUMN     "archived_by_user_id" TEXT,
ADD COLUMN     "archived_reason" TEXT;

-- CreateTable
CREATE TABLE "customer_events" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" "CustomerEventType" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_events_workshop_id_idx" ON "customer_events"("workshop_id");

-- CreateIndex
CREATE INDEX "customer_events_customer_id_idx" ON "customer_events"("customer_id");

-- CreateIndex
CREATE INDEX "customer_events_user_id_idx" ON "customer_events"("user_id");

-- CreateIndex
CREATE INDEX "customer_events_type_idx" ON "customer_events"("type");

-- CreateIndex
CREATE INDEX "customer_events_created_at_idx" ON "customer_events"("created_at");

-- CreateIndex
CREATE INDEX "customers_archived_at_idx" ON "customers"("archived_at");

-- CreateIndex
CREATE INDEX "customers_archived_by_user_id_idx" ON "customers"("archived_by_user_id");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_archived_by_user_id_fkey" FOREIGN KEY ("archived_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_events" ADD CONSTRAINT "customer_events_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_events" ADD CONSTRAINT "customer_events_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_events" ADD CONSTRAINT "customer_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
