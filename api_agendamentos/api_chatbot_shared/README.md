# API Chatbot — Núcleo compartilhado

Este diretório contém a lógica usada por **PSF1**, **PSF2** e **PSF3**.

**Não exponha esta pasta diretamente na web.** Use sempre:

- `api_chatbot_psf1/`
- `api_chatbot_psf2/`
- `api_chatbot_psf3/`

Documentação: [../DOCUMENTACAO_API_CHATBOT.md](../DOCUMENTACAO_API_CHATBOT.md)

## Banco de dados (Docker / Swarm)

Se `DB_HOST`, `DB_NAME` e `DB_USER` estiverem definidos, o `bootstrap.php` conecta direto (sem `conexao.php`).

| Variável | Obrigatória | Padrão |
|----------|-------------|--------|
| `DB_HOST` | sim | — |
| `DB_NAME` ou `DB_DATABASE` | sim | — |
| `DB_USER` | sim | — |
| `DB_PASS` ou `DB_PASSWORD` | não | vazio |
| `DB_PORT` | não | `3306` |

Sem essas variáveis, continua usando `painel/conexao/conexao.php` (deploy cPanel).
