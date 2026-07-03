#!/bin/bash
# Deploy homolog na VPS (build local + restart Swarm)
# Uso: bash scripts/deploy-homolog-vps.sh
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/zeladoriaDigital}"
VAPID_KEY="${VAPID_KEY:-BBgnsD01iawVTAFIv7a36-dflljF9eS5EAytPG6cKgcQi-J_0ZJdgrcLF2S0rLqWebvgMupYPb_DCB6C3G6xI-c}"

echo "==> Atualizando código em ${REPO_DIR}"
cd "${REPO_DIR}"
git pull origin main

DEPLOY_TAG="${DEPLOY_TAG:-$(git rev-parse --short HEAD)}"
API_IMAGE="zeladoria-api:${DEPLOY_TAG}"
WEB_IMAGE="zeladoria-web:${DEPLOY_TAG}"

echo "==> Build API"
docker build -f docker/api/Dockerfile -t "${API_IMAGE}" .

echo "==> Build Web"
docker build -f docker/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://api-homolog.prefeituranamao.com.br \
  --build-arg NEXT_PUBLIC_PSF1_API_URL=https://saude.agendaclique.com.br/api_chatbot_psf1 \
  --build-arg NEXT_PUBLIC_PSF2_API_URL=https://saude.agendaclique.com.br/api_chatbot_psf2 \
  --build-arg NEXT_PUBLIC_PSF3_API_URL=https://saude.agendaclique.com.br/api_chatbot_psf3 \
  --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY="${VAPID_KEY}" \
  -t "${WEB_IMAGE}" .

echo "==> Reiniciando serviços Swarm"
docker service update --force --image "${API_IMAGE}" prefeitura_zeladoria-api
docker service update --force --image "${WEB_IMAGE}" prefeitura_zeladoria-web

echo "==> Migration (confirmação)"
sleep 15
docker exec "$(docker ps -q -f name=zeladoria-api | head -1)" sh -c "cd /app/apps/api && npx prisma migrate deploy"

echo "==> Deploy concluído"
docker ps --filter name=zeladoria --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
