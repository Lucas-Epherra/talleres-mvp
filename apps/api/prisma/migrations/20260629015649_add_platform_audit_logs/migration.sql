-- CreateEnum
CREATE TYPE "PlatformAuditAction" AS ENUM ('WORKSHOP_CREATED', 'WORKSHOP_DISABLED', 'WORKSHOP_ENABLED', 'INVITATION_CREATED', 'INVITATION_REVOKED', 'INVITATION_RESENT', 'INVITATION_ARCHIVED', 'USER_ACCESS_DISABLED', 'USER_ACCESS_ENABLED', 'USER_ROLE_UPDATED');

-- CreateEnum
CREATE TYPE "PlatformAuditEntityType" AS ENUM ('WORKSHOP', 'INVITATION', 'USER_ACCESS');

-- CreateTable
CREATE TABLE "platform_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "action" "PlatformAuditAction" NOT NULL,
    "entity_type" "PlatformAuditEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "workshop_id" TEXT,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_audit_logs_actor_user_id_idx" ON "platform_audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "platform_audit_logs_workshop_id_idx" ON "platform_audit_logs"("workshop_id");

-- CreateIndex
CREATE INDEX "platform_audit_logs_action_idx" ON "platform_audit_logs"("action");

-- CreateIndex
CREATE INDEX "platform_audit_logs_entity_type_entity_id_idx" ON "platform_audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "platform_audit_logs_created_at_idx" ON "platform_audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
