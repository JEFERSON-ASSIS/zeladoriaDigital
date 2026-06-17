# Uso do PWA

## O que foi habilitado

- Registro do `service worker` somente em produção.
- Fallback de navegação para `offline.html` quando não houver conexão.
- Manifest público com ícones do aplicativo.
- Botão de instalação nas telas do cidadão.

## Como testar

1. Abra a aplicação web em modo normal.
2. Acesse algumas telas para preencher o cache do navegador.
3. Ative o modo offline no navegador.
4. Recarregue a página ou navegue para outra rota.
5. O sistema deve exibir a tela de offline ou manter o conteúdo já carregado.

## Observações

- Os ícones do app estão em `apps/web/public/icons`.
- O botão de instalação aparece quando o navegador suporta instalação ou no iPhone com instruções de acesso rápido.
- Se quiser forçar atualização do cache, limpe os dados do site no navegador.
