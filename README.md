# Zeladoria Digital

Plataforma municipal de zeladoria em monorepo — ocorrências, ordens de serviço, mapas, relatórios, PWA cidadão e agendamento PSF.

**Repositório:** https://github.com/cristhyna-lucena/zeladoriaDigital

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 14 + TypeScript |
| Backend | NestJS + TypeScript |
| Banco | PostgreSQL + Prisma |
| Auth | JWT + RBAC por perfil e menu |
| Infra local | Docker Compose (Postgres + MinIO) |
| PWA | Service Worker + Web Push |
| Agendamento | API PHP (`api_agendamentos/`) |

---

## Estrutura do monorepo

```txt
ZeladoriaDigital/
├── apps/
│   ├── web/          # Next.js (porta 3000)
│   └── api/          # NestJS (porta 3333)
├── packages/
│   └── shared/       # tipos, labels, permissões de menu
├── api_agendamentos/ # APIs PHP PSF1/2/3 (deploy separado)
├── docker-compose.yml
├── .env.example      # modelo — NÃO commitar .env
└── README.md
```

---

## O que o Docker faz (e o que NÃO faz)

O `docker-compose.yml` sobe **somente**:

| Serviço | Porta | Função |
|---------|-------|--------|
| **postgres** | 5434 → 5432 | Banco de dados |
| **minio** | 9000 / 9001 | Storage (opcional; uploads usam disco local) |

**API e Web NÃO rodam no Docker.** Na VPS eles rodam com Node.js (PM2 ou systemd).

```
┌─────────────────────────────────────────────┐
│                    VPS                       │
│  Docker: Postgres + MinIO                      │
│  Node.js: API (:3333) + Web (:3000)          │
│  Nginx: HTTPS → proxy reverso                │
└─────────────────────────────────────────────┘
```

---

## Desenvolvimento local

### 1. Pré-requisitos

- Node.js 20+
- Docker Desktop (ou Docker + Compose)
- Git

### 2. Setup

```powershell
# Na raiz do projeto
npm install
copy .env.example .env
docker compose up -d
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 3. Rodar

Em dois terminais (ou use `npm run dev` na raiz):

```powershell
npm run dev --workspace apps/api    # http://localhost:3333
npm run dev --workspace apps/web    # http://localhost:3000
```

> **Atenção:** `ts-node` no dev **não recarrega** sozinho. Após alterar código da API, reinicie o terminal da API.

### 4. Usuários demo (seed)

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Administrador | admin@zeladoria.local | secret123 |
| Prefeitura | prefeitura@zeladoria.local | secret123 |
| Admin secretaria | secretaria@zeladoria.local | secret123 |
| Usuário secretaria | equipe@zeladoria.local | secret123 |
| Cidadão | cidadao@zeladoria.local | secret123 |

Com `NODE_ENV=production`, contas demo **não funcionam** como fallback — use usuários do banco.

---

## Git: fluxo de trabalho

### Enviar alterações

```powershell
git add .
git commit -m "descrição da mudança"
git pull --rebase origin main   # integrar commits remotos antes do push
git push origin main
```

### Se o push for rejeitado (`non-fast-forward`)

O remoto está à frente. Sempre faça **pull com rebase** antes de push:

```powershell
git pull --rebase origin main
# resolver conflitos, se houver:
git add .
git -c core.editor=true rebase --continue
git push origin main
```

### O que NÃO vai para o Git

- `.env` (segredos e URLs de ambiente)
- `node_modules/`, `.next/`, `dist/`, `uploads/`

Use `.env.example` como referência e crie `.env` em cada ambiente.

---

## Deploy em VPS (homologação)

### Domínios de homolog (exemplo)

| Serviço | URL |
|---------|-----|
| Frontend | https://homolog.prefeituranamao.com.br |
| API | https://api-homolog.prefeituranamao.com.br |

DNS dos subdomínios deve apontar para o IP da VPS **antes** de configurar SSL.

---

### 1. Preparar a VPS (uma vez)

```bash
sudo apt update
sudo apt install -y git nodejs npm nginx certbot python3-certbot-nginx
sudo npm install -g pm2

# Node 20+ (se necessário)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

### 2. Clonar o projeto

```bash
cd /var/www
git clone https://github.com/cristhyna-lucena/zeladoriaDigital.git
cd zeladoriaDigital
```

---

### 3. Configurar `.env` na VPS

```bash
cp .env.example .env
nano .env
```

Exemplo para homolog:

```env
NODE_ENV=production
JWT_SECRET=<string-longa-e-aleatoria>
JWT_EXPIRES_IN=1d

APP_URL=https://homolog.prefeituranamao.com.br
API_URL=https://api-homolog.prefeituranamao.com.br
NEXT_PUBLIC_API_URL=https://api-homolog.prefeituranamao.com.br

DATABASE_URL=postgresql://zeladoria:SENHA_FORTE@localhost:5434/zeladoria?schema=public
POSTGRES_DB=zeladoria
POSTGRES_USER=zeladoria
POSTGRES_PASSWORD=SENHA_FORTE

WEB_PORT=3000
API_PORT=3333

# Agendamento PSF
NEXT_PUBLIC_PSF1_API_URL=https://saude.agendaclique.com.br/api_chatbot_psf1
NEXT_PUBLIC_PSF2_API_URL=https://saude.agendaclique.com.br/api_chatbot_psf2
NEXT_PUBLIC_PSF3_API_URL=https://saude.agendaclique.com.br/api_chatbot_psf3

# Web Push (gerar par VAPID para homolog)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@prefeituranamao.com.br
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

**Importante:** `NEXT_PUBLIC_*` precisa estar definido **antes** do build do Next.js.

---

### 4. Subir banco e aplicação

```bash
docker compose up -d
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed          # opcional em homolog (dados demo)
npm run build
```

---

### 5. PM2 (manter API e Web no ar)

```bash
pm2 start npm --name zeladoria-api -- run start:api
pm2 start npm --name zeladoria-web -- run start:web
pm2 save
pm2 startup
```

---

### 6. Nginx + SSL

Crie dois sites apontando para:

- `homolog.prefeituranamao.com.br` → `http://127.0.0.1:3000`
- `api-homolog.prefeituranamao.com.br` → `http://127.0.0.1:3333`

Depois:

```bash
sudo certbot --nginx \
  -d homolog.prefeituranamao.com.br \
  -d api-homolog.prefeituranamao.com.br
```

PWA e Web Push **exigem HTTPS**.

---

### 7. Atualizações (deploy contínuo)

```bash
cd /var/www/zeladoriaDigital
git pull origin main
npm install
npm run prisma:migrate:deploy
npm run build
pm2 restart zeladoria-api zeladoria-web
```

---

## Comandos npm (raiz)

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev em todos os workspaces |
| `npm run build` | Build produção (API + Web) |
| `npm run start:api` | API compilada (`node dist/...`) |
| `npm run start:web` | Next.js produção |
| `npm run prisma:generate` | Gera Prisma Client |
| `npm run prisma:migrate` | Migration dev (`migrate dev`) |
| `npm run prisma:migrate:deploy` | Migration produção |
| `npm run prisma:seed` | Dados demo |

---

## Perfis de acesso

| Código | Nome na UI | Escopo |
|--------|------------|--------|
| ADMIN | Administrador | Tudo |
| PREFEITURA | Prefeitura | Operacional geral |
| SECRETARIA | Admin secretaria | Só sua secretaria; gerencia usuários da unidade |
| EQUIPE_CAMPO | Usuário secretaria | Só demandas da secretaria |
| CIDADAO | Cidadão | PWA, ocorrências, agendamentos |

Permissões de menu configuráveis em `/admin/permissoes`.

---

## Agendamento PSF (PHP — deploy separado)

As APIs de agendamento ficam em `api_agendamentos/` e rodam em servidor PHP (ex.: `saude.agendaclique.com.br`), **não na VPS do NestJS**.

Arquivos importantes para publicar:

- `api_agendamentos/api_chatbot_shared/src/Services/ListagemService.php`
- `api_agendamentos/api_chatbot_psf1/endpoints/agendamentos/listar_pwa.php`
- `api_agendamentos/api_chatbot_psf2/endpoints/agendamentos/listar_pwa.php`
- `api_agendamentos/api_chatbot_psf3/endpoints/agendamentos/listar_pwa.php`

Documentação OpenAPI: `api_agendamentos/api_chatbot_shared/docs/openapi.yaml`

---

## Pastas persistentes na VPS

| Caminho | Conteúdo |
|---------|----------|
| `apps/api/uploads/` | Anexos de ocorrências (não vai no Git) |
| Volume Docker `postgres_data` | Dados do banco |

---

## Segurança em produção

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` forte e único por ambiente
- [ ] Senhas fortes no Postgres
- [ ] HTTPS via Nginx + Certbot
- [ ] `.env` nunca commitado
- [ ] Contas demo desabilitadas automaticamente em produção

---

## Checklist antes de homolog

- [ ] Código no GitHub (`git push origin main`)
- [ ] DNS apontando para a VPS
- [ ] `.env` configurado na VPS
- [ ] `docker compose up -d`
- [ ] `npm run prisma:migrate:deploy`
- [ ] `npm run build` (com `NEXT_PUBLIC_*` corretos)
- [ ] PM2 rodando API e Web
- [ ] Nginx + SSL
- [ ] Login com usuário do seed
- [ ] PHP agendamento publicado (se usar PWA cidadão)

---

## Solução de problemas

| Problema | Causa provável | Solução |
|----------|----------------|---------|
| Push rejeitado | Remoto à frente | `git pull --rebase origin main` |
| API não reflete mudanças | Dev sem hot reload | Reiniciar terminal da API |
| `departmentId must be a UUID` | API antiga rodando | Reiniciar API após pull |
| Lista usuários vazia (secretaria) | Sessão sem `departmentId` | Sair e entrar de novo |
| Build Web falha | `NEXT_PUBLIC_*` ausente | Definir no `.env` antes do build |
| PWA/push não funciona | Sem HTTPS | Configurar SSL no Nginx |

---

## Licença e suporte

Desenvolvido por **i7AI Sistemas** — Zeladoria Digital.
