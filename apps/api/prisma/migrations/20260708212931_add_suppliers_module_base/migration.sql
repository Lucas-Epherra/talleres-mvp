-- CreateEnum
CREATE TYPE "SupplierMarkupType" AS ENUM ('NONE', 'PERCENTAGE', 'FIXED_AMOUNT', 'MANUAL_PRICE');

-- CreateEnum
CREATE TYPE "SupplierPaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'MERCADO_PAGO', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "SupplierEventType" AS ENUM ('CREATED', 'UPDATED', 'ARCHIVED', 'RESTORED', 'CATEGORY_ASSIGNED', 'CATEGORY_REMOVED', 'PART_CREATED', 'PART_UPDATED', 'PART_ARCHIVED', 'PAYMENT_CREATED', 'PAYMENT_UPDATED', 'PAYMENT_VOIDED');

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "tax_id" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "archived_at" TIMESTAMP(3),
    "archived_reason" TEXT,
    "archived_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_categories" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_category_assignments" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_category_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_parts" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "category_id" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT,
    "current_cost" DECIMAL(12,2) NOT NULL,
    "suggested_markup_type" "SupplierMarkupType",
    "suggested_markup_value" DECIMAL(12,2),
    "suggested_customer_price" DECIMAL(12,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "supplier_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_payments" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "created_by_user_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" "SupplierPaymentMethod" NOT NULL DEFAULT 'OTHER',
    "reference" TEXT,
    "notes" TEXT,
    "voided_at" TIMESTAMP(3),
    "voided_reason" TEXT,
    "voided_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_events" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" "SupplierEventType" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_part_lines" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "supplier_part_id" TEXT,
    "part_name_snapshot" TEXT NOT NULL,
    "supplier_name_snapshot" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "supplier_unit_cost" DECIMAL(12,2) NOT NULL,
    "customer_unit_price" DECIMAL(12,2) NOT NULL,
    "markup_type" "SupplierMarkupType" NOT NULL DEFAULT 'MANUAL_PRICE',
    "markup_value" DECIMAL(12,2),
    "supplier_subtotal" DECIMAL(12,2) NOT NULL,
    "customer_subtotal" DECIMAL(12,2) NOT NULL,
    "gross_profit" DECIMAL(12,2) NOT NULL,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_order_part_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suppliers_workshop_id_idx" ON "suppliers"("workshop_id");

-- CreateIndex
CREATE INDEX "suppliers_name_idx" ON "suppliers"("name");

-- CreateIndex
CREATE INDEX "suppliers_phone_idx" ON "suppliers"("phone");

-- CreateIndex
CREATE INDEX "suppliers_email_idx" ON "suppliers"("email");

-- CreateIndex
CREATE INDEX "suppliers_tax_id_idx" ON "suppliers"("tax_id");

-- CreateIndex
CREATE INDEX "suppliers_archived_at_idx" ON "suppliers"("archived_at");

-- CreateIndex
CREATE INDEX "suppliers_archived_by_user_id_idx" ON "suppliers"("archived_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_workshop_id_name_key" ON "suppliers"("workshop_id", "name");

-- CreateIndex
CREATE INDEX "supplier_categories_workshop_id_idx" ON "supplier_categories"("workshop_id");

-- CreateIndex
CREATE INDEX "supplier_categories_archived_at_idx" ON "supplier_categories"("archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_categories_workshop_id_name_key" ON "supplier_categories"("workshop_id", "name");

-- CreateIndex
CREATE INDEX "supplier_category_assignments_workshop_id_idx" ON "supplier_category_assignments"("workshop_id");

-- CreateIndex
CREATE INDEX "supplier_category_assignments_supplier_id_idx" ON "supplier_category_assignments"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_category_assignments_category_id_idx" ON "supplier_category_assignments"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_category_assignments_supplier_id_category_id_key" ON "supplier_category_assignments"("supplier_id", "category_id");

-- CreateIndex
CREATE INDEX "supplier_parts_workshop_id_idx" ON "supplier_parts"("workshop_id");

-- CreateIndex
CREATE INDEX "supplier_parts_supplier_id_idx" ON "supplier_parts"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_parts_category_id_idx" ON "supplier_parts"("category_id");

-- CreateIndex
CREATE INDEX "supplier_parts_sku_idx" ON "supplier_parts"("sku");

-- CreateIndex
CREATE INDEX "supplier_parts_is_active_idx" ON "supplier_parts"("is_active");

-- CreateIndex
CREATE INDEX "supplier_parts_archived_at_idx" ON "supplier_parts"("archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_parts_workshop_id_supplier_id_name_key" ON "supplier_parts"("workshop_id", "supplier_id", "name");

-- CreateIndex
CREATE INDEX "supplier_payments_workshop_id_idx" ON "supplier_payments"("workshop_id");

-- CreateIndex
CREATE INDEX "supplier_payments_supplier_id_idx" ON "supplier_payments"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_payments_created_by_user_id_idx" ON "supplier_payments"("created_by_user_id");

-- CreateIndex
CREATE INDEX "supplier_payments_voided_by_user_id_idx" ON "supplier_payments"("voided_by_user_id");

-- CreateIndex
CREATE INDEX "supplier_payments_paid_at_idx" ON "supplier_payments"("paid_at");

-- CreateIndex
CREATE INDEX "supplier_payments_method_idx" ON "supplier_payments"("method");

-- CreateIndex
CREATE INDEX "supplier_payments_voided_at_idx" ON "supplier_payments"("voided_at");

-- CreateIndex
CREATE INDEX "supplier_events_workshop_id_idx" ON "supplier_events"("workshop_id");

-- CreateIndex
CREATE INDEX "supplier_events_supplier_id_idx" ON "supplier_events"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_events_user_id_idx" ON "supplier_events"("user_id");

-- CreateIndex
CREATE INDEX "supplier_events_type_idx" ON "supplier_events"("type");

-- CreateIndex
CREATE INDEX "supplier_events_created_at_idx" ON "supplier_events"("created_at");

-- CreateIndex
CREATE INDEX "work_order_part_lines_workshop_id_idx" ON "work_order_part_lines"("workshop_id");

-- CreateIndex
CREATE INDEX "work_order_part_lines_work_order_id_idx" ON "work_order_part_lines"("work_order_id");

-- CreateIndex
CREATE INDEX "work_order_part_lines_supplier_id_idx" ON "work_order_part_lines"("supplier_id");

-- CreateIndex
CREATE INDEX "work_order_part_lines_supplier_part_id_idx" ON "work_order_part_lines"("supplier_part_id");

-- CreateIndex
CREATE INDEX "work_order_part_lines_purchased_at_idx" ON "work_order_part_lines"("purchased_at");

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_archived_by_user_id_fkey" FOREIGN KEY ("archived_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_categories" ADD CONSTRAINT "supplier_categories_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_category_assignments" ADD CONSTRAINT "supplier_category_assignments_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_category_assignments" ADD CONSTRAINT "supplier_category_assignments_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_category_assignments" ADD CONSTRAINT "supplier_category_assignments_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "supplier_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_parts" ADD CONSTRAINT "supplier_parts_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_parts" ADD CONSTRAINT "supplier_parts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_parts" ADD CONSTRAINT "supplier_parts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "supplier_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_voided_by_user_id_fkey" FOREIGN KEY ("voided_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_events" ADD CONSTRAINT "supplier_events_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_events" ADD CONSTRAINT "supplier_events_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_events" ADD CONSTRAINT "supplier_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_part_lines" ADD CONSTRAINT "work_order_part_lines_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_part_lines" ADD CONSTRAINT "work_order_part_lines_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_part_lines" ADD CONSTRAINT "work_order_part_lines_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_part_lines" ADD CONSTRAINT "work_order_part_lines_supplier_part_id_fkey" FOREIGN KEY ("supplier_part_id") REFERENCES "supplier_parts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
