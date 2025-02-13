from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app

from src.api.routes import api_router
from src.core.config import get_settings
from src.core.logging import setup_logging
from src.core.middleware import (
    LoggingMiddleware,
    PrometheusMiddleware,
    RequestIdMiddleware,
    TenantMiddleware,
)

settings = get_settings()
setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multi-tenant LLM Backend with OpenAI-compatible API",
    docs_url="/api/docs" if settings.SHOW_API_DOCS else None,
    redoc_url="/api/redoc" if settings.SHOW_API_DOCS else None,
)

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

# Mount Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
