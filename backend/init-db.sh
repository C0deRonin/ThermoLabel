#!/bin/bash

# Database initialization script for ThermoLabel

set -e

DB_NAME=${DB_NAME:-"thermolabel_db"}
DB_USER=${DB_USER:-"thermolabel_user"}
DB_PASSWORD=${DB_PASSWORD:-"thermolabel_password"}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}

echo "Initializing ThermoLabel Database..."
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_HOST:$DB_PORT"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "ERROR: psql is not installed. Please install PostgreSQL client tools."
    exit 1
fi

# Try to connect to database
echo ""
echo "Testing database connection..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Database connection successful"
else
    echo "! Database is not accessible. Make sure PostgreSQL is running."
    echo "  If database doesn't exist, create it with:"
    echo "  createdb -h $DB_HOST -U postgres $DB_NAME"
    echo "  createuser -h $DB_HOST -U postgres $DB_USER"
    echo "  ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    exit 1
fi

# Run Alembic migrations
echo ""
echo "Running database migrations..."
cd "$(dirname "$0")"

export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✓ Database migration successful"
else
    echo "✗ Database migration failed"
    exit 1
fi

echo ""
echo "✓ Database initialization complete!"
