-- CreateTable
CREATE TABLE "SchedulingPushSubscription" (
    "id" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "psfId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "remindedAt" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedulingPushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleMenuPermission" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "menuKey" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleMenuPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchedulingPushSubscription_endpoint_key" ON "SchedulingPushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "SchedulingPushSubscription_cpf_psfId_idx" ON "SchedulingPushSubscription"("cpf", "psfId");

-- CreateIndex
CREATE UNIQUE INDEX "RoleMenuPermission_role_menuKey_key" ON "RoleMenuPermission"("role", "menuKey");

-- CreateIndex
CREATE INDEX "RoleMenuPermission_role_idx" ON "RoleMenuPermission"("role");
