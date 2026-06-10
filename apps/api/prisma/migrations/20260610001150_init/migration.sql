-- CreateEnum
CREATE TYPE "WorkshopRole" AS ENUM ('OWNER', 'ADMIN', 'OPERATOR');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'READY', 'DELIVERED');

-- CreateTable
CREATE TABLE "workshops" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_members" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "WorkshopRole" NOT NULL DEFAULT 'OPERATOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "license_plate" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "mileage" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "order_number" INTEGER NOT NULL,
    "reported_issue" TEXT NOT NULL,
    "diagnosis" TEXT,
    "work_done" TEXT,
    "parts_used" TEXT,
    "labor_cost" DECIMAL(12,2),
    "parts_cost" DECIMAL(12,2),
    "estimated_total" DECIMAL(12,2),
    "final_total" DECIMAL(12,2),
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'PENDING',
    "entry_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivery_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workshops_slug_key" ON "workshops"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "workshop_members_workshop_id_idx" ON "workshop_members"("workshop_id");

-- CreateIndex
CREATE INDEX "workshop_members_user_id_idx" ON "workshop_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_members_workshop_id_user_id_key" ON "workshop_members"("workshop_id", "user_id");

-- CreateIndex
CREATE INDEX "customers_workshop_id_idx" ON "customers"("workshop_id");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "vehicles_workshop_id_idx" ON "vehicles"("workshop_id");

-- CreateIndex
CREATE INDEX "vehicles_customer_id_idx" ON "vehicles"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_workshop_id_license_plate_key" ON "vehicles"("workshop_id", "license_plate");

-- CreateIndex
CREATE INDEX "work_orders_workshop_id_idx" ON "work_orders"("workshop_id");

-- CreateIndex
CREATE INDEX "work_orders_vehicle_id_idx" ON "work_orders"("vehicle_id");

-- CreateIndex
CREATE INDEX "work_orders_status_idx" ON "work_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_workshop_id_order_number_key" ON "work_orders"("workshop_id", "order_number");

-- AddForeignKey
ALTER TABLE "workshop_members" ADD CONSTRAINT "workshop_members_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_members" ADD CONSTRAINT "workshop_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
