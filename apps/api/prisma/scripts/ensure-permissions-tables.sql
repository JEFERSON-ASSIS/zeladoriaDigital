-- Garante tabelas da migration de permissões (caso tenha falhado parcialmente)
CREATE TABLE IF NOT EXISTS "SchedulingPushSubscription" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "SchedulingPushSubscription_endpoint_key" ON "SchedulingPushSubscription"("endpoint");
CREATE INDEX IF NOT EXISTS "SchedulingPushSubscription_cpf_psfId_idx" ON "SchedulingPushSubscription"("cpf", "psfId");

CREATE TABLE IF NOT EXISTS "RoleMenuPermission" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "menuKey" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RoleMenuPermission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RoleMenuPermission_role_menuKey_key" ON "RoleMenuPermission"("role", "menuKey");
CREATE INDEX IF NOT EXISTS "RoleMenuPermission_role_idx" ON "RoleMenuPermission"("role");
