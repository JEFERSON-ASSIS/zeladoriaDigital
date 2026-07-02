-- AlterTable
ALTER TABLE "Citizen" ADD COLUMN "blockedAt" TIMESTAMP(3),
ADD COLUMN "blockedReason" TEXT;
