-- Garante "Avisos do app" no menu do administrador e prefeitura
INSERT INTO "RoleMenuPermission" ("id", "role", "menuKey", "allowed", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'ADMIN', 'avisos-app', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PREFEITURA', 'avisos-app', true, NOW(), NOW())
ON CONFLICT ("role", "menuKey") DO UPDATE SET
  "allowed" = true,
  "updatedAt" = NOW();
