#!/bin/sh
set -e

cd /app/apps/api
npx prisma migrate deploy

if [ -f prisma/seed.js ]; then
  echo "Running database seed..."
  node prisma/seed.js
fi

cd /app
exec "$@"
