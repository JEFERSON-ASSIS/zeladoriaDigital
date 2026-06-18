# Deploy Docker Swarm / Portainer

## Domínios (homolog)

| Serviço | URL |
|---------|-----|
| Web | https://homolog.prefeituranamao.com.br |
| API | https://api-homolog.prefeituranamao.com.br |

## 1. Rede overlay

A stack usa a rede **`SGDMNET`** (mesma do SGDM/Traefik). Ela já deve existir no Swarm — não é necessário criar outra rede.

## 2. Build das imagens

Na raiz do monorepo:

```bash
# API
docker build -f docker/api/Dockerfile -t ghcr.io/jeferson-assis/zeladoria-api:homolog .

# Web — NEXT_PUBLIC_* entram no BUILD (obrigatório)
docker build -f docker/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://api-homolog.prefeituranamao.com.br \
  --build-arg NEXT_PUBLIC_PSF1_API_URL=https://saude.agendaclique.com.br/api_chatbot_psf1 \
  --build-arg NEXT_PUBLIC_PSF2_API_URL=https://saude.agendaclique.com.br/api_chatbot_psf2 \
  --build-arg NEXT_PUBLIC_PSF3_API_URL=https://saude.agendaclique.com.br/api_chatbot_psf3 \
  --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY=SUA_CHAVE \
  -t ghcr.io/jeferson-assis/zeladoria-web:homolog .

docker push ghcr.io/jeferson-assis/zeladoria-api:homolog
docker push ghcr.io/jeferson-assis/zeladoria-web:homolog
```

## 3. Portainer

1. **Stacks** → Add stack
2. Cole `docker/portainer-stack.yml`
3. Environment variables → copie de `docker/.env.portainer.example`
4. Deploy

A API roda `prisma migrate deploy` automaticamente ao subir.

## 4. Seed (opcional, uma vez)

```bash
docker exec -it $(docker ps -q -f name=zeladoria-api) sh -c "cd /app/apps/api && npx ts-node prisma/seed.ts"
```

Ou rode seed antes do build em pipeline de CI.
