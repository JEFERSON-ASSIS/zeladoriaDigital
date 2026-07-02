-- AlterTable
ALTER TABLE "Citizen" ADD COLUMN "healthUnitPsfId" TEXT;

-- CreateIndex
CREATE INDEX "Citizen_healthUnitPsfId_idx" ON "Citizen"("healthUnitPsfId");
