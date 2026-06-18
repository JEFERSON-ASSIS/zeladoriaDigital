-- CreateTable
CREATE TABLE "CitizenAnnouncement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT,
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "pushSentAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CitizenAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitizenPushSubscription" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CitizenPushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CitizenAnnouncement_published_publishedAt_idx" ON "CitizenAnnouncement"("published", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CitizenPushSubscription_endpoint_key" ON "CitizenPushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "CitizenPushSubscription_citizenId_idx" ON "CitizenPushSubscription"("citizenId");
