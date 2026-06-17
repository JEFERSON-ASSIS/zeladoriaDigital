# Etapa 4 - PWA e Comunicação Operacional

Data: 17 de junho de 2026

## Objetivo da etapa

Entregar a experiência PWA do cidadão e a camada de comunicação operacional do sistema, incluindo instalação do app, uso offline e histórico de mensagens com WhatsApp preparado para envio real.

## Entregue nesta etapa

- manifest público da aplicação
- service worker com cache básico e fallback offline
- página offline dedicada
- ícones PNG do aplicativo
- botão de instalação do PWA nas telas do cidadão
- suporte visual e meta tags para iOS
- base de notificações push no backend
- histórico persistido de mensagens WhatsApp
- envio opcional via WhatsApp Cloud API quando configurado
- tela administrativa para consultar o histórico de mensagens

## O que já funciona

- instalação do app no navegador compatível
- acesso offline com fallback seguro
- registro automático de mensagens do WhatsApp no banco
- envio real opcional quando as credenciais forem configuradas
- consulta do histórico no painel administrativo

## Arquivos principais

- `apps/web/public/manifest.json`
- `apps/web/public/service-worker.js`
- `apps/web/public/offline.html`
- `apps/web/public/icons/`
- `apps/web/src/components/install-pwa-button.tsx`
- `apps/web/src/app/admin/whatsapp/page.tsx`
- `apps/api/src/modules/whatsapp/whatsapp.service.ts`
- `apps/api/src/modules/whatsapp/whatsapp.controller.ts`

## Validação

- build da API executado com sucesso
- build do frontend executado com sucesso
- repositório salvo e enviado para o git

## Próximo passo sugerido

Refinar testes automatizados do fluxo de WhatsApp, depois seguir para uploads e relatórios avançados.
