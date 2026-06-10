# Etapa 1 - Zeladoria Digital

Data: 10 de junho de 2026

## Objetivo da etapa

Entregar a base funcional da plataforma de zeladoria municipal com backend, frontend, banco, autenticação, fluxo operacional e navegação mínima para operação e cidadão.

## Entregue nesta etapa

- Monorepo com `apps/web`, `apps/api` e `packages/shared`
- Next.js + TypeScript no frontend
- NestJS + TypeScript no backend
- PostgreSQL com Prisma
- Docker Compose com PostgreSQL e MinIO
- JWT e proteção básica por perfil
- Sessão real no frontend com restauração via `/auth/me`
- CRUD base para usuários, cidadãos, categorias, departamentos, bairros e ocorrências
- Dashboard executivo inicial
- Kanban de ocorrências com drag and drop
- Fluxo do cidadão para abrir ocorrência
- Consulta por protocolo
- Tela de "Minhas solicitações"
- Fluxo de ordem de serviço com início, execução e finalização
- Conclusão automática da ocorrência ao finalizar a OS
- Seed inicial com perfis operacionais e dados de exemplo
- README e documentação básica do projeto

## O que já funciona

- Login de usuário e cidadão
- Proteção de rotas principais
- Cadastro e consulta de ocorrências
- Movimentação de status com trilha no banco
- Geração automática de OS ao entrar no fluxo operacional
- Finalização de OS com conclusão automática da ocorrência
- Dashboard com cards, gráfico simples, resumo e mapa ilustrativo
- Consulta do cidadão por protocolo e histórico de solicitações

## O que ainda falta

- Integração real com WhatsApp
- Upload real de arquivos no MinIO
- Relatórios e exportações avançadas
- Melhor tratamento de erros na API
- Tipagem mais forte nos payloads
- Testes de controller e integração com banco
- Revisão final de UX da tela principal

## Observação

Esta etapa consolida o fluxo principal da plataforma e deixa a base pronta para evolução para relatórios, mapas reais, arquivos e integrações externas.
