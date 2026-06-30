-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PlatformAuditAction" ADD VALUE 'WORKSHOP_ARCHIVED';
ALTER TYPE "PlatformAuditAction" ADD VALUE 'WORKSHOP_RESTORED';

-- AlterEnum
ALTER TYPE "WorkshopStatus" ADD VALUE 'ARCHIVED';

-- AlterTable
ALTER TABLE "workshops" ADD COLUMN     "archived_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "workshops_archived_at_idx" ON "workshops"("archived_at");
