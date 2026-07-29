CREATE TYPE "SupportConversationStatus" AS ENUM ('NOVA', 'EM_ATENDIMENTO', 'FINALIZADA');
CREATE TYPE "SupportSenderType" AS ENUM ('CIDADAO', 'ATENDENTE');
CREATE TYPE "SupportMessageType" AS ENUM ('TEXTO', 'IMAGEM', 'AUDIO');

CREATE TABLE "SupportConversation" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "healthUnitPsfId" TEXT,
    "status" "SupportConversationStatus" NOT NULL DEFAULT 'NOVA',
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    CONSTRAINT "SupportConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderType" "SupportSenderType" NOT NULL,
    "citizenId" TEXT,
    "userId" TEXT,
    "type" "SupportMessageType" NOT NULL,
    "text" TEXT,
    "mediaUrl" TEXT,
    "mimeType" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupportConversation_citizenId_updatedAt_idx" ON "SupportConversation"("citizenId", "updatedAt");
CREATE INDEX "SupportConversation_healthUnitPsfId_status_updatedAt_idx" ON "SupportConversation"("healthUnitPsfId", "status", "updatedAt");
CREATE INDEX "SupportMessage_conversationId_createdAt_idx" ON "SupportMessage"("conversationId", "createdAt");
CREATE INDEX "SupportMessage_conversationId_readAt_idx" ON "SupportMessage"("conversationId", "readAt");

ALTER TABLE "SupportConversation" ADD CONSTRAINT "SupportConversation_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportConversation" ADD CONSTRAINT "SupportConversation_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "SupportConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
