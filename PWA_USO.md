# Uso do PWA

## O que foi habilitado

- Registro do `service worker` no carregamento da aplicação web.
- Fallback de navegação para a tela `/offline` quando não houver conexão.
- Manifest com ícones do aplicativo.

## Como testar

1. Abra a aplicação web em modo normal.
2. Acesse algumas telas para preencher o cache do navegador.
3. Ative o modo offline no navegador.
4. Recarregue a página ou navegue para outra rota.
5. O sistema deve exibir a tela de offline ou manter o conteúdo já carregado.

## Observações

- O `service worker` é registrado automaticamente em produção e também em ambiente local.
- Os ícones do app estão em `apps/web/public`.
- Se quiser forçar atualização do cache, limpe os dados do site no navegador.
