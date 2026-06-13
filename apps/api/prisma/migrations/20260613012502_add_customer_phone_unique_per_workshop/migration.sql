/*
  Warnings:

  - A unique constraint covering the columns `[workshop_id,phone]` on the table `customers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "customers_workshop_id_phone_key" ON "customers"("workshop_id", "phone");
