from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import get_settings
from src.core.middleware import (
    LoggingMiddleware,
    PrometheusMiddleware,
    RequestIdMiddleware,
    TenantMiddleware,
)

settings = get_settings()


def setup_middleware(app: FastAPI) -> None:
    """Configure middleware for the application"""

    # Set up CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add custom middleware
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(TenantMiddleware)
    app.add_middleware(LoggingMiddleware)
    app.add_middleware(PrometheusMiddleware)
