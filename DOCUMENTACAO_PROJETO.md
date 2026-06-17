# Documentação do Projeto - Zeladoria Digital

Este documento resume o que foi construído até agora, como a solução está organizada e o que ainda resta para finalizar a atividade. Ele serve como referência técnica e funcional do estado atual do sistema.

## Visão Geral

O Zeladoria Digital é uma plataforma municipal para registro, triagem, encaminhamento e acompanhamento de ocorrências. A solução foi construída em monorepo com frontend Next.js, backend NestJS, banco PostgreSQL e ORM Prisma.

## O que já foi feito

### Estrutura do projeto

- Monorepo criado com `apps/web`, `apps/api` e `packages/shared`
- Configuração de TypeScript compartilhada
- Docker Compose para PostgreSQL e MinIO
- Ajuste de dependências para instalação e build no ambiente atual

### Banco de dados e persistência

- Schema Prisma criado com as entidades principais
- Migration inicial aplicada
- Prisma Client gerado
- Seed inicial criado e executado com dados de teste

### Backend

- API NestJS estruturada por módulos
- JWT e Passport configurados
- RBAC inicial implementado
- Guards de autenticação e roles configurados
- CRUD base implementado para:
  - usuários
  - cidadãos
  - categorias
  - departamentos
  - bairros
  - ocorrências
- Validação com DTOs
- Testes iniciais da API implementados e passando

### Autenticação

- Login real no backend para usuário administrador
- Login real no backend para cidadão
- Login real no frontend
- Logout no frontend
- Sessão persistida no navegador
- Proteção básica de acesso no frontend

### Frontend

- Home inicial funcional
- Dashboard lendo dados reais da API
- Tela de login funcional
- Página de ordens de serviço
- Menu lateral adaptado ao perfil
- Fallback para quando a API não responder

### Fluxo operacional

- Criação automática de movimentação ao criar ocorrência
- Criação de movimentação ao alterar status
- Geração automática de ordem de serviço em status operacional
- SLA inicial por prioridade
- Priorização automática baseada no conteúdo da ocorrência
- Sugestão automática de departamento
- Detecção simples de duplicidade

### Seed e dados de teste

- Município demo criado
- Usuário admin criado
- Cidadão demo criado
- Categoria criada
- Secretaria criada
- Bairro criado
- Ocorrência exemplo criada
- Movimentação inicial criada
- Notificação inicial criada

## Como o sistema está organizado

### Backend

- `auth`: autenticação, JWT e roles
- `users`: usuários administrativos
- `citizens`: cidadãos
- `occurrences`: ocorrências e movimentações
- `departments`: secretarias
- `categories`: categorias de ocorrência
- `neighborhoods`: bairros
- `priority`: priorização e sugestões
- `whatsapp`: histórico persistido e envio opcional via API externa configurável

### Frontend

- `/login`: autenticação
- `/`: dashboard principal
- `/ordens-servico`: visualização das ordens de serviço

## Estado atual

O sistema já está em um estado funcional, com:

- backend compilando
- frontend compilando
- banco sincronizado
- login operacional
- cadastro mínimo funcional
- fluxos principais de ocorrência caminhando para o uso real

## O que ainda falta

### Última etapa principal

- Comunicação operacional com WhatsApp e histórico de mensagens

### Itens complementares

- Melhor tratamento de erros na API
- Mais testes de controller e integração
- Limpeza dos `any` remanescentes
- Proteção de rotas por perfil mais refinada
- Revisão final de UX
- Fluxos de mapa, relatórios e uploads
- Evolução da integração de notificações e mensagens

## Ordem de prioridade restante

1. Melhorar tratamento de erros e tipagem
2. Ampliar testes
3. Refinar experiência visual e navegação
4. Evoluir notificações e integrações externas

## Como executar localmente

### Dependências

```bash
npm install
```

### Infraestrutura

```bash
docker compose up -d
```

### Banco

```bash
npm run prisma:migrate --workspace apps/api
```

### Desenvolvimento

```bash
npm run dev
```

### Acesso de teste

- Admin: `admin@zeladoria.local`
- Senha: `secret123`
- Cidadão: `cidadao@zeladoria.local`
- Senha: `secret123`

## Observações

- O sistema foi construído para evoluir de forma incremental.
- O WhatsApp é a última etapa da criação principal do sistema.
- O documento de acompanhamento de progresso continua em `STATUS_ATIVIDADE.md`.
