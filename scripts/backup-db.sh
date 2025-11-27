#!/bin/bash

# Database backup script for Supabase
# Usage: ./scripts/backup-db.sh [environment]
# Example: ./scripts/backup-db.sh production

set -e

ENV=${1:-production}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups"
BACKUP_FILE="${BACKUP_DIR}/backup_${ENV}_${TIMESTAMP}.sql"

# Create backups directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Determine which env file to use
if [ "$ENV" = "production" ]; then
  ENV_FILE=".env.production.local"
  if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found. Please create it or use 'vercel env pull .env.production.local'"
    exit 1
  fi
  source "$ENV_FILE"
elif [ "$ENV" = "development" ]; then
  ENV_FILE=".env.development.local"
  if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found."
    exit 1
  fi
  source "$ENV_FILE"
else
  echo "Error: Unknown environment '$ENV'. Use 'production' or 'development'"
  exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not found in $ENV_FILE"
  exit 1
fi

# Use DIRECT_URL if available (required for Supabase), otherwise fall back to DATABASE_URL
DB_URL="${DIRECT_URL:-$DATABASE_URL}"

echo "Creating backup for $ENV environment..."
echo "Backup file: $BACKUP_FILE"

# Run pg_dump
# Options:
#   --no-owner: Don't output commands to set ownership of objects
#   --no-acl: Don't output access privileges (grants/revokes)
#   --clean: Include commands to drop objects before creating them
#   --if-exists: Use IF EXISTS when dropping objects
pg_dump "$DB_URL" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  --verbose \
  > "$BACKUP_FILE" 2>&1

# Check if backup was successful
if [ $? -eq 0 ]; then
  # Compress the backup
  gzip "$BACKUP_FILE"
  BACKUP_FILE="${BACKUP_FILE}.gz"

  FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "✅ Backup created successfully!"
  echo "   File: $BACKUP_FILE"
  echo "   Size: $FILE_SIZE"
  echo ""
  echo "To restore this backup, use:"
  echo "   gunzip -c $BACKUP_FILE | psql \"\$DATABASE_URL\""
else
  echo "❌ Backup failed!"
  rm -f "$BACKUP_FILE"
  exit 1
fi

