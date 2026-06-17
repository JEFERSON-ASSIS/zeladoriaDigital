# Entrega Fase PWA - Zeladoria Digital

## Visão geral

A etapa PWA foi incorporada ao sistema com foco em acesso mobile, uso offline e instalação como aplicativo, priorizando a jornada do cidadão.

## Entregue

- manifest público da aplicação
- service worker com cache do app shell e fallback offline
- página offline dedicada
- botões de instalação do aplicativo nas telas do cidadão
- ícones PNG padrão e maskable
- base para notificações push no backend
- documentação de uso do PWA

## Arquivos principais

- `apps/web/public/manifest.json`
- `apps/web/public/service-worker.js`
- `apps/web/public/offline.html`
- `apps/web/public/icons/icon-192.png`
- `apps/web/public/icons/icon-512.png`
- `apps/web/public/icons/apple-touch-icon.png`
- `apps/web/src/components/install-pwa-button.tsx`
- `apps/web/src/app/providers.tsx`
- `apps/web/src/app/layout.tsx`
- `apps/api/src/modules/push-notifications/push-notification.service.ts`
- `apps/api/src/modules/push-notifications/push-notifications.module.ts`
- `PWA_USO.md`

## Validação

- build do frontend executado com sucesso
- build da API executado com sucesso
- manifest exposto em `/manifest.json`
- registro do service worker feito apenas em produção

## Observação final

Esta etapa não depende de credenciais externas e pode ser validada localmente no navegador. O backend de push foi preparado como base para a próxima integração com notificações.
