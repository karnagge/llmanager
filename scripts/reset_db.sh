#!/bin/bash

# Exit on any error
set -e

echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec llmanager-postgres-1 pg_isready -U llmanager; do
    echo "Waiting for PostgreSQL to start..."
    sleep 1
done

echo "🗑️ Dropping and recreating databases..."
docker exec -i llmanager-postgres-1 psql -U llmanager postgres << EOF
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname IN ('tenant_system', 'tenant_admin');
DROP DATABASE IF EXISTS tenant_system;
DROP DATABASE IF EXISTS tenant_admin;
CREATE DATABASE tenant_system;
CREATE DATABASE tenant_admin;
\q
EOF

# Initialize tenant_system with schema and create admin tenant
echo "🔄 Initializing tenant_system database..."
docker exec -i llmanager-postgres-1 psql -U llmanager tenant_system < scripts/init_db.sql

# Initialize tenant_admin with schema
echo "🔄 Initializing tenant_admin database..."
docker exec -i llmanager-postgres-1 psql -U llmanager tenant_admin < scripts/init_db.sql

# First create admin tenant and API key in tenant_system
echo "👤 Creating admin tenant and API key..."
poetry run python scripts/create_admin.py

# Then create admin user in tenant_admin
echo "👤 Creating admin user..."
poetry run python scripts/create_user.py

echo "✅ Environment reset complete!"
echo "You can now make requests using the API key shown above."