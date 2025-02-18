from fastapi import FastAPI
from fastapi.security import APIKeyHeader
from fastapi.staticfiles import StaticFiles
from prometheus_client import make_asgi_app

from src.api.router import api_router
from src.app.handlers import setup_exception_handlers
from src.app.middleware import setup_middleware
from src.app.openapi import setup_openapi
from src.app.views import setup_views
from src.core.config import get_settings
from src.core.logging import get_logger, setup_logging

settings = get_settings()
logger = get_logger(__name__)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application"""

    # Configure logging with settings
    setup_logging(settings.LOG_LEVEL)

    # Create FastAPI app
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Multi-tenant LLM Backend with OpenAI-compatible API",
        docs_url="/api/docs" if settings.SHOW_API_DOCS else None,
        redoc_url="/api/redoc" if settings.SHOW_API_DOCS else None,
    )

    # Setup OpenAPI schema
    setup_openapi(app)

    # Setup middleware
    setup_middleware(app)

    # Setup exception handlers
    setup_exception_handlers(app)

    # Mount static files
    app.mount("/static", StaticFiles(directory="static"), name="static")

    # Mount Prometheus metrics endpoint
    metrics_app = make_asgi_app()
    app.mount("/metrics", metrics_app)

    # Security dependencies
    api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)
    tenant_id_header = APIKeyHeader(name="X-Tenant-ID", auto_error=True)

    # Include API routes
    # Note: Security dependencies are handled by the get_current_tenant_and_key dependency in the routes
    app.include_router(api_router, prefix="/api/v1")

    # Setup basic views
    setup_views(app)

    return app
