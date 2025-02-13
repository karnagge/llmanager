# LLM Backend

Multi-tenant LLM Backend with OpenAI-compatible API

## Description

A scalable backend service that provides OpenAI-compatible API endpoints for managing and accessing Large Language Models in a multi-tenant environment.

## Features

- Multi-tenant architecture
- OpenAI-compatible API
- Token quota management
- Rate limiting
- Prometheus metrics
- Grafana dashboards

## Development

The project uses Poetry for dependency management and Docker for containerization.

### Setup

1. Install dependencies:
```bash
poetry install
```

2. Start services:
```bash
docker-compose up -d
```

### Environment Variables

Copy `.env.example` to `.env` and configure the following variables:
- DATABASE_URL
- REDIS_URL
- SECRET_KEY
- DEBUG
- LOG_LEVEL
- SHOW_API_DOCS