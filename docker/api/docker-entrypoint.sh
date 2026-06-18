#!/bin/sh
set -e

cd /app/apps/api
npx prisma migrate deploy

cd /app
exec "$@"
