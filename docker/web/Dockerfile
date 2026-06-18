FROM node:20-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/

RUN npm ci

FROM deps AS builder

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_PSF1_API_URL
ARG NEXT_PUBLIC_PSF2_API_URL
ARG NEXT_PUBLIC_PSF3_API_URL
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG NEXT_PUBLIC_SHOW_DEMO_HINTS=false

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_PSF1_API_URL=$NEXT_PUBLIC_PSF1_API_URL
ENV NEXT_PUBLIC_PSF2_API_URL=$NEXT_PUBLIC_PSF2_API_URL
ENV NEXT_PUBLIC_PSF3_API_URL=$NEXT_PUBLIC_PSF3_API_URL
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_SHOW_DEMO_HINTS=$NEXT_PUBLIC_SHOW_DEMO_HINTS

RUN npm run build --workspace apps/web

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/

RUN npm ci --omit=dev --workspace apps/web

COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/packages/shared ./packages/shared

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace", "apps/web"]
