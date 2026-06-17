# Cron Jobs da Fase 4

Os cron jobs ficam centralizados em `apps/api/src/modules/jobs/jobs.service.ts`.
O agendador é ativado por `ScheduleModule.forRoot()` em `apps/api/src/modules/jobs/jobs.module.ts`.

## Jobs ativos

- `01:00` - recalcula pontuação de prioridade
- `hora em hora` - atualiza indicadores e alertas
- `02:00` - atualiza cache do heatmap
- `03:00` - prepara relatórios diários e exportações

## Como usar

1. Suba o PostgreSQL.
2. Suba a API.
3. Deixe o processo da API rodando para os cron jobs executarem automaticamente.

### Desenvolvimento

```bash
npm --workspace apps/api run start:dev
```

### Produção local

```bash
npm --workspace apps/api run build
npm --workspace apps/api run start
```

## Observações

- Os jobs usam o mesmo banco e os mesmos serviços do sistema.
- Se o banco estiver fora, os cron jobs vão falhar junto com a API.
- A exportação gerada pelo cron diário não grava arquivo em disco ainda; ela prepara os dados e valida o fluxo.

