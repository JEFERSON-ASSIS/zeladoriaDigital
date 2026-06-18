-- CreateEnum
CREATE TYPE "PushNotificationSource" AS ENUM ('ANNOUNCEMENT', 'SCHEDULING_REMINDER');

-- CreateTable
CREATE TABLE "PushNotificationLog" (
    "id" TEXT NOT NULL,
    "source" "PushNotificationSource" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "targetCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "announcementId" TEXT,
    "createdById" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushNotificationRecipient" (
    "id" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "citizenId" TEXT,
    "phone" TEXT,
    "cpf" TEXT,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushNotificationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PushNotificationLog_sentAt_idx" ON "PushNotificationLog"("sentAt");

-- CreateIndex
CREATE INDEX "PushNotificationLog_source_idx" ON "PushNotificationLog"("source");

-- CreateIndex
CREATE INDEX "PushNotificationRecipient_logId_idx" ON "PushNotificationRecipient"("logId");

-- AddForeignKey
ALTER TABLE "CitizenPushSubscription" ADD CONSTRAINT "CitizenPushSubscription_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushNotificationRecipient" ADD CONSTRAINT "PushNotificationRecipient_logId_fkey" FOREIGN KEY ("logId") REFERENCES "PushNotificationLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
