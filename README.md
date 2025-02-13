# LLM Backend

A multi-tenant backend service that provides access to various LLM models through an OpenAI-compatible API interface.

## Features

- OpenAI-compatible API endpoints
- Multi-tenant architecture with complete isolation
- Support for multiple LLM providers (OpenAI, Azure, Google Cloud, AWS)
- Token usage tracking and quota management
- Rate limiting and caching
- Webhook notifications
- Admin dashboard
- Comprehensive monitoring and logging
- Docker-based development environment

## Prerequisites

- Python 3.11 or higher
- Docker and Docker Compose
- PostgreSQL 15
- Redis 7

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/llm-backend.git
cd llm-backend
```

2. Run the development setup script:
```bash
chmod +x scripts/setup_dev.sh
./scripts/setup_dev.sh
```

The script will:
- Create necessary directories and configurations
- Set up environment variables
- Install dependencies
- Start Docker containers
- Run database migrations
- Create initial admin tenant and user

3. Access the services:
- API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Grafana Dashboard: http://localhost:3000

Default admin credentials:
- Email: admin@example.com
- Password: adminpassword

## Project Structure

```
llm-backend/
├── docker/                 # Docker configurations
├── migrations/            # Database migrations
├── scripts/              # Utility scripts
├── src/                  # Source code
│   ├── api/             # API routes
│   ├── core/            # Core functionality
│   ├── models/          # Database models
│   └── services/        # Business logic
├── tests/               # Test suite
├── alembic.ini          # Migration configuration
├── docker-compose.yml   # Development environment
└── pyproject.toml       # Project dependencies
```

## Configuration

Configuration is managed through environment variables. Create a `.env` file based on the example below:

```env
# PostgreSQL
POSTGRES_USER=llmuser
POSTGRES_PASSWORD=your_password
POSTGRES_DB=llm_backend

# Redis
REDIS_PASSWORD=your_password

# Application
SECRET_KEY=your_secret_key
DEBUG=false
LOG_LEVEL=INFO
SHOW_API_DOCS=true

# Model Providers
OPENAI_API_KEY=your_openai_key
AZURE_API_KEY=your_azure_key
GOOGLE_API_KEY=your_google_key
AWS_ACCESS_KEY_ID=your_aws_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret

# Monitoring
GRAFANA_PASSWORD=your_grafana_password
```

## API Usage

### Authentication

All API requests require authentication using Bearer token or API key:

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

### Multi-tenancy

Each tenant gets:
- Isolated database
- Separate token quotas
- Custom rate limits
- Individual webhooks
- Usage analytics

## Development

1. Install dependencies:
```bash
poetry install
```

2. Run tests:
```bash
poetry run pytest
```

3. Format code:
```bash
poetry run black src tests
poetry run isort src tests
```

4. Type checking:
```bash
poetry run mypy src
```

## Monitoring

### Metrics

The following metrics are available in Grafana:
- Request latency
- Token usage
- Error rates
- Cache hit rates
- Database performance
- System resources

### Logging

Logs are structured in JSON format and include:
- Request ID
- Tenant ID
- User ID
- Token usage
- Error details
- Performance metrics

## Administration

### Creating a New Tenant

```bash
curl -X POST http://localhost:8000/admin/tenants \
  -H "X-API-Key: admin_api_key" \
  -d '{
    "name": "Example Tenant",
    "quota_limit": 100000
  }'
```

### Managing API Keys

```bash
curl -X POST http://localhost:8000/admin/tenants/{tenant_id}/api-keys \
  -H "X-API-Key: admin_api_key" \
  -d '{
    "name": "Production API Key",
    "permissions": {
      "models": ["gpt-4", "gpt-3.5-turbo"],
      "max_tokens": 4096
    }
  }'
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Submit a pull request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and development process.

## Security

Report security issues to security@yourdomain.com

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Authors

- Your Name - Initial work

## Acknowledgments

- OpenAI for the API specification
- FastAPI framework
- SQLAlchemy ORM
- Langchain library