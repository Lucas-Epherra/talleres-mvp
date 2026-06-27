-- AlterTable
ALTER TABLE "invitations" ADD COLUMN     "archived_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "invitations_archived_at_idx" ON "invitations"("archived_at");
