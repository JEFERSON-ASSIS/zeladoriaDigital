-- Permissões PWA: Início + Agendar + Consultas (Solicitar/Chamados off)
INSERT INTO "RoleMenuPermission" ("id", "role", "menuKey", "allowed", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'CIDADAO', 'inicio', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'CIDADAO', 'nova-ocorrencia', false, NOW(), NOW()),
  (gen_random_uuid()::text, 'CIDADAO', 'minhas-solicitacoes', false, NOW(), NOW()),
  (gen_random_uuid()::text, 'CIDADAO', 'agendamento', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'CIDADAO', 'meus-agendamentos', true, NOW(), NOW())
ON CONFLICT ("role", "menuKey") DO UPDATE SET
  "allowed" = EXCLUDED."allowed",
  "updatedAt" = NOW();

-- Aviso de exemplo na Home
INSERT INTO "CitizenAnnouncement" (
  "id", "title", "summary", "body", "published", "publishedAt", "createdAt", "updatedAt"
)
SELECT
  'demo-home-avisos',
  'Bem-vindo ao app Prefeitura na Mão',
  'Acompanhe avisos, agende consultas e fique por dentro dos serviços ao cidadão.',
  'Esta é a área de comunicados da prefeitura. Novos avisos aparecem aqui automaticamente quando forem publicados pelo painel administrativo.',
  true,
  NOW(),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "CitizenAnnouncement" WHERE "id" = 'demo-home-avisos'
);
