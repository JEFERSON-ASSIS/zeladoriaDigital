ALTER TABLE "CitizenPushSubscription"
ADD COLUMN "userId" TEXT;

CREATE INDEX "CitizenPushSubscription_userId_idx"
ON "CitizenPushSubscription"("userId");

ALTER TABLE "CitizenPushSubscription"
ADD CONSTRAINT "CitizenPushSubscription_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
