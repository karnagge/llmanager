#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Setting up development environment...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${YELLOW}Creating necessary directories...${NC}"
mkdir -p docker/grafana/provisioning/dashboards
mkdir -p docker/grafana/provisioning/datasources
mkdir -p docker/prometheus

# Create Prometheus config
echo -e "${YELLOW}Creating Prometheus configuration...${NC}"
cat > docker/prometheus/prometheus.yml << EOL
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'llm-backend'
    static_configs:
      - targets: ['api:8000']
EOL

# Create Grafana datasource configuration
echo -e "${YELLOW}Creating Grafana datasource configuration...${NC}"
cat > docker/grafana/provisioning/datasources/datasource.yml << EOL
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOL

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << EOL
# PostgreSQL
POSTGRES_USER=llmuser
POSTGRES_PASSWORD=devpassword
POSTGRES_DB=llm_backend

# Redis
REDIS_PASSWORD=devpassword

# Application
SECRET_KEY=devsecretkey
DEBUG=true
LOG_LEVEL=DEBUG
SHOW_API_DOCS=true

# Grafana
GRAFANA_PASSWORD=admin

# Default admin user
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=adminpassword
EOL
fi

# Install Python dependencies
echo -e "${YELLOW}Installing Python dependencies...${NC}"
if ! command -v poetry &> /dev/null; then
    echo -e "${YELLOW}Installing Poetry...${NC}"
    curl -sSL https://install.python-poetry.org | python3 -
fi

poetry install

# Build and start containers
echo -e "${YELLOW}Starting Docker containers...${NC}"
docker compose up -d --build

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
poetry run alembic upgrade head

# Create initial admin user and tenant
echo -e "${YELLOW}Creating initial admin tenant and user...${NC}"
cat > scripts/init_admin.py << EOL
import asyncio
import uuid
from src.core.auth import AuthService
from src.core.database import get_tenant_db_session
from src.models.system import Tenant
from src.models.tenant import User, UserRole

async def create_admin():
    # Create admin tenant
    tenant_id = str(uuid.uuid4())
    
    async with get_tenant_db_session("system") as session:
        tenant = Tenant(
            id=tenant_id,
            name="Admin Tenant",
            db_name=f"tenant_admin",
            quota_limit=1000000,
            config={
                "rate_limit": {
                    "requests": 1000,
                    "period": 3600
                }
            }
        )
        session.add(tenant)
        await session.commit()
    
    # Create admin user in tenant database
    async with get_tenant_db_session(tenant_id) as session:
        user = User(
            id=str(uuid.uuid4()),
            email="admin@example.com",
            name="Admin User",
            password_hash=AuthService.hash_password("adminpassword"),
            role=UserRole.ADMIN,
            quota_limit=500000
        )
        session.add(user)
        await session.commit()

asyncio.run(create_admin())
EOL

poetry run python scripts/init_admin.py

echo -e "${GREEN}Development environment setup complete!${NC}"
echo -e "${GREEN}API running at: http://localhost:8000${NC}"
echo -e "${GREEN}Grafana dashboard: http://localhost:3000${NC}"
echo -e "${GREEN}Admin credentials: admin@example.com / adminpassword${NC}"