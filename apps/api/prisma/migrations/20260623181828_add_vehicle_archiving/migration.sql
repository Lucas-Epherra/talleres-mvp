-- CreateEnum
CREATE TYPE "VehicleEventType" AS ENUM ('ARCHIVED', 'RESTORED');

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "archived_at" TIMESTAMP(3),
ADD COLUMN     "archived_by_user_id" TEXT,
ADD COLUMN     "archived_reason" TEXT;

-- CreateTable
CREATE TABLE "vehicle_events" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" "VehicleEventType" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_events_workshop_id_idx" ON "vehicle_events"("workshop_id");

-- CreateIndex
CREATE INDEX "vehicle_events_vehicle_id_idx" ON "vehicle_events"("vehicle_id");

-- CreateIndex
CREATE INDEX "vehicle_events_user_id_idx" ON "vehicle_events"("user_id");

-- CreateIndex
CREATE INDEX "vehicle_events_type_idx" ON "vehicle_events"("type");

-- CreateIndex
CREATE INDEX "vehicle_events_created_at_idx" ON "vehicle_events"("created_at");

-- CreateIndex
CREATE INDEX "vehicles_archived_at_idx" ON "vehicles"("archived_at");

-- CreateIndex
CREATE INDEX "vehicles_archived_by_user_id_idx" ON "vehicles"("archived_by_user_id");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_archived_by_user_id_fkey" FOREIGN KEY ("archived_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_events" ADD CONSTRAINT "vehicle_events_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_events" ADD CONSTRAINT "vehicle_events_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_events" ADD CONSTRAINT "vehicle_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
