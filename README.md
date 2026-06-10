# Zeladoria Digital

Plataforma digital de zeladoria municipal em monorepo, preparada para evoluir com fluxo completo de ocorrências, ordens de serviço, mapa operacional, relatórios e automações.

## Objetivo

Centralizar o atendimento, triagem, encaminhamento e execução de demandas municipais com rastreabilidade, perfis de acesso e base pronta para operação em prefeitura.

## Tecnologias

- Frontend: Next.js + TypeScript
- Backend: NestJS + TypeScript
- Banco: PostgreSQL
- ORM: Prisma
- Upload: MinIO
- Autenticação: JWT
- Infra local: Docker Compose
- Compartilhamento: pacote `shared`

## Estrutura

```txt
zeladoria/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   └── shared/
├── docker/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Como rodar localmente

1. Instale dependências:

```bash
npm install
```

2. Suba banco e MinIO:

```bash
docker compose up -d
```

3. Configure o ambiente:

```bash
copy .env.example .env
```

4. Gere o schema e rode as migrations:

```bash
npx prisma migrate dev
```

5. Abra o Prisma Studio:

```bash
npx prisma studio
```

6. Rode os apps:

```bash
npm run dev
```

## Comandos principais

- `npm install`
- `docker compose up -d`
- `npm run dev`
- `npx prisma migrate dev`
- `npx prisma studio`

## Fluxo principal

1. Cidadão abre ocorrência
2. Prefeitura recebe
3. Triagem analisa
4. Encaminha para secretaria
5. Cria OS
6. Equipe executa
7. Finaliza OS
8. Ocorrência é concluída
9. Cidadão é notificado

## Variáveis de ambiente

Consulte [.env.example](./.env.example).

## O que já está preparado

- Estrutura do monorepo
- Docker com PostgreSQL e MinIO
- Schema Prisma com tabelas principais
- Backend NestJS com módulos base
- Frontend Next.js com layout inicial
- JWT, guards e RBAC inicial
- Dashboard inicial com leitura da API
- CRUD base com create/update/delete para cidadãos, usuários, secretarias, categorias, bairros e ocorrências
- Kanban de ocorrências
- Services estruturais para WhatsApp e priorização
- Testes iniciais para auth e ocorrências

## Como publicar futuramente

1. Crie um repositório no GitHub.
2. Inicialize o remote:

```bash
git remote add origin <URL_DO_REPOSITORIO>
```

3. Envie a branch principal:

```bash
git push -u origin main
```

## Conectar ao GitHub

Depois de criar o repositório remoto, use os comandos acima. Se quiser manter uma convenção de branches, recomendo `main` para produção e `develop` para evolução.

## Próximos passos

- Completar telas de autenticação
- Integrar upload real no MinIO
- Implementar mapa com Leaflet/OpenStreetMap
- Evoluir relatórios e exportações
- Conectar WhatsApp real
- Cobrir regras de negócio com testes de integração
