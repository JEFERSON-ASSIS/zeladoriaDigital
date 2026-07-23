# Webchats de Agendamento - Documentação

## Status: implementado e compilando

Foram criados 3 webchats conversacionais, um por unidade, em rota separada:

- `/chat/psf1` - PSF 1 Sol Nascente
- `/chat/psf2` - PSF 2 Centro
- `/chat/psf3` - UBS Rural

## Arquivos principais

```text
apps/web/src/app/chat/
├── layout.tsx
├── [psfId]/page.tsx
├── components/
│   ├── chat-flow.tsx
│   ├── chat-message.tsx
│   └── chat-input.tsx
├── hooks/
│   └── use-agendamento-flow.ts
└── lib/
    └── validation.ts
```

## O que o fluxo faz

- Coleta nome, telefone e CPF.
- Valida CPF e telefone no frontend.
- Lista os serviços disponíveis conforme a unidade.
- Busca datas, horários ou turnos usando a mesma API já usada pelo PWA.
- Confirma o agendamento usando o fluxo correto por tipo de serviço.

## Integração com a API

O webchat reutiliza as funções de `apps/web/src/lib/scheduling/scheduling-api.ts`, evitando duplicar regras de agendamento.

Fluxos respeitados:

- Médico por hora: `dias_medico.php` -> `horarios_medico.php` -> `criar_medico_hora.php`
- Médico por turno: `dias.php` -> `turnos.php` -> `criar.php`
- Dentista: `dias.php` -> `horarios.php` -> `criar.php`
- Enfermeiro: `dias.php` -> `criar.php`

## Validação atual

Comando executado:

```bash
npm --workspace apps/web run build
```

Resultado: build concluído com sucesso e rota `/chat/[psfId]` incluída no output.

## Pendências antes de produção

- Testar o fluxo completo no navegador contra a API real.
- Confirmar visual em mobile e desktop.
- Publicar o build atualizado no ambiente de produção.

