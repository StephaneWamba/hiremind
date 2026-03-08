#!/bin/bash

# Database migration script for HireMind

set -e

echo "🔄 Running database migrations..."

# Export DATABASE_URL from credentials
export DATABASE_URL="postgresql://neondb_owner:npg_wDXt0HWFPV5b@ep-divine-dawn-ak1lsffn-pooler.c-3.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

cd packages/db

echo "📊 Pushing schema to database..."
pnpm db:push

echo "✅ Migrations complete!"
