-- CreateEnum
CREATE TYPE "WorkOrderEventType" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'DELIVERED');

-- CreateTable
CREATE TABLE "work_order_events" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" "WorkOrderEventType" NOT NULL,
    "from_status" "WorkOrderStatus",
    "to_status" "WorkOrderStatus",
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_order_events_workshop_id_idx" ON "work_order_events"("workshop_id");

-- CreateIndex
CREATE INDEX "work_order_events_work_order_id_idx" ON "work_order_events"("work_order_id");

-- CreateIndex
CREATE INDEX "work_order_events_user_id_idx" ON "work_order_events"("user_id");

-- CreateIndex
CREATE INDEX "work_order_events_type_idx" ON "work_order_events"("type");

-- CreateIndex
CREATE INDEX "work_order_events_created_at_idx" ON "work_order_events"("created_at");

-- AddForeignKey
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
