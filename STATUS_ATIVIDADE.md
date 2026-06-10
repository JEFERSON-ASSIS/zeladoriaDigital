# Status da Atividade - Zeladoria Digital

Documento de acompanhamento do que já foi implementado e do que ainda falta para concluir a atividade.

## Objetivo

Entregar uma base funcional da plataforma de zeladoria municipal com backend, frontend, banco, autenticação, CRUDs principais, testes e fluxo mínimo navegável.

## Concluído

- Monorepo criado com `apps/web`, `apps/api` e `packages/shared`
- Frontend Next.js compilando com sucesso
- Backend NestJS compilando com sucesso
- Banco PostgreSQL e MinIO configurados via Docker Compose
- Prisma Client gerado e migration inicial aplicada
- Schema Prisma criado com as entidades principais
- Módulos base do backend organizados
- JWT, Passport e RBAC estruturados
- CRUD base implementado para:
  - usuários
  - cidadãos
  - categorias
  - departamentos
  - bairros
  - ocorrências
- DTOs de validação adicionados
- Testes da API implementados e passando
- Frontend conectado à API com fallback seguro
- Login real no frontend
- Logout real no frontend
- Proteção básica de rota no frontend
- Endpoint `/auth/me` para restaurar a sessão do usuário autenticado
- Fluxo de abertura de ocorrência para o cidadão com captura de localização
- Consulta de ocorrências por protocolo no frontend
- Tela de "Minhas solicitações" para o cidadão acompanhar status e histórico
- Página de ordens de serviço no frontend
- Login de cidadão funcionando
- Home inicial funcionando no navegador
- Ajustes de configuração para o monorepo instalar e buildar neste ambiente
- Seed inicial do banco com perfis operacionais e dados mínimos
- Criação automática de movimentação ao criar ocorrência
- Criação de movimentação ao alterar status da ocorrência
- Criação automática de ordem de serviço ao entrar em status operacional
- Fluxo operacional da ordem de serviço com início, execução e finalização
- Conclusão automática da ocorrência ao finalizar a OS
- SLA inicial por prioridade para a ordem de serviço
- Priorização automática baseada no conteúdo da ocorrência
- Sugestão automática de departamento
- Detecção simples de duplicidade
- Kanban de ocorrências com drag and drop
- Proteção de rotas por perfil no backend nas entidades principais

## Parcial

- WhatsApp ainda é simulado, mas a priorização já calcula score, nível e sugestão de departamento
- README existe, mas ainda pode evoluir para refletir com mais precisão o estado final do produto
- Base de dados já existe, mas ainda pode evoluir com mais dados de demo e cenários de teste

## Pendente

- Integração real com WhatsApp
- Melhor tratamento de erros na API
- Tipagem mais forte nos payloads, reduzindo uso de `any`
- Testes de controller e integração com banco
- Fluxos de mapa, relatórios e uploads
- Revisão final de UX da tela principal

## Problemas já encontrados e corrigidos

- Dependência `workspace:*` no pacote compartilhado, ajustada para referência local compatível com o ambiente
- Configuração do `PrismaService` com `beforeExit`, removida por incompatibilidade de tipagem
- Schema Prisma com relações sem campo inverso, corrigido
- Prisma Client não gerado, corrigido com `prisma generate`
- Banco sem tabelas, corrigido com migration inicial

## Próximos passos recomendados

1. Evoluir relatórios, mapa e indicadores executivos
2. Integrar upload real no MinIO
3. Melhorar testes e tratamento de erros
4. Conectar WhatsApp real quando houver credenciais

## Critério de conclusão

A atividade só deve ser considerada finalizada quando:

- o backend responder estável
- o frontend estiver autenticado de verdade
- os dados mínimos existirem no banco
- os fluxos principais estiverem navegáveis
- os testes principais estiverem cobrindo os casos centrais
- a consulta por protocolo e o fluxo de OS estiverem completos no produto
