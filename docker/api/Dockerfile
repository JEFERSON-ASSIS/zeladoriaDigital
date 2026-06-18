FROM node:20-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/

RUN npm ci

FROM deps AS builder

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api

RUN npm run build --workspace @zeladoria/shared
RUN npm run prisma:generate --workspace apps/api
RUN npx tsc -p apps/api/prisma/tsconfig.seed.json
RUN npm run build --workspace apps/api

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV API_PORT=3333

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/prisma/dist-seed/seed.js ./apps/api/prisma/seed.js
COPY docker/api/docker-entrypoint.sh /docker-entrypoint.sh

RUN sed -i 's/\r$//' /docker-entrypoint.sh \
  && chmod +x /docker-entrypoint.sh \
  && mkdir -p /app/uploads

VOLUME ["/app/uploads"]

EXPOSE 3333

ENTRYPOINT ["sh", "/docker-entrypoint.sh"]
CMD ["node", "apps/api/dist/apps/api/src/main.js"]
