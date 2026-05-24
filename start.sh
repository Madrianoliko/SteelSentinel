#!/bin/sh
set -e

echo "🛡️  Steel Sentinel — starting up"

# Railway injects DATABASE_URL automatically for Postgres plugin.
# Fix URL scheme: Railway sometimes gives postgres:// but SQLAlchemy needs postgresql://
export DATABASE_URL="${DATABASE_URL/postgres:\/\//postgresql://}"

echo "⏳ Running database migrations..."
alembic upgrade head

echo "🌱 Seeding database (skips if data already exists)..."
python seed.py

echo "🚀 Starting uvicorn on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
