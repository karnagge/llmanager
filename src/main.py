from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from prometheus_client import make_asgi_app
from sqlalchemy.exc import SQLAlchemyError

from src.api.router import api_router
from src.core.config import get_settings
from src.core.exceptions import (
    InvalidAPIKeyError,
    LLMBackendException,
    ModelNotAvailableError,
    QuotaExceededError,
    RateLimitExceededError,
)
from src.core.logging import get_logger, setup_logging
from src.core.middleware import (
    LoggingMiddleware,
    PrometheusMiddleware,
    RequestIdMiddleware,
    TenantMiddleware,
)
from src.core.utils import format_error_response

settings = get_settings()
logger = get_logger(__name__)
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


# Exception handlers
@app.exception_handler(QuotaExceededError)
async def quota_exceeded_handler(
    request: Request, exc: QuotaExceededError
) -> JSONResponse:
    """Handle quota exceeded errors"""
    logger.warning(
        "quota_exceeded",
        tenant_id=getattr(request.state, "tenant_id", None),
        quota_limit=exc.extra.get("quota_limit"),
        current_usage=exc.extra.get("current_usage"),
    )

    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content=format_error_response(
            message=str(exc),
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            extra=exc.extra,
        ),
    )


@app.exception_handler(RateLimitExceededError)
async def rate_limit_handler(
    request: Request, exc: RateLimitExceededError
) -> JSONResponse:
    """Handle rate limit errors"""
    logger.warning(
        "rate_limit_exceeded",
        tenant_id=getattr(request.state, "tenant_id", None),
        retry_after=exc.extra.get("retry_after"),
    )

    response = JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content=format_error_response(
            message=str(exc),
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            extra=exc.extra,
        ),
    )

    if exc.extra.get("retry_after"):
        response.headers["Retry-After"] = str(exc.extra["retry_after"])

    return response


@app.exception_handler(InvalidAPIKeyError)
async def invalid_api_key_handler(
    request: Request, exc: InvalidAPIKeyError
) -> JSONResponse:
    """Handle invalid API key errors"""
    logger.warning(
        "invalid_api_key", client_host=request.client.host, path=request.url.path
    )

    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content=format_error_response(
            message=str(exc), status_code=status.HTTP_401_UNAUTHORIZED
        ),
        headers={"WWW-Authenticate": "Bearer"},
    )


@app.exception_handler(ModelNotAvailableError)
async def model_not_available_handler(
    request: Request, exc: ModelNotAvailableError
) -> JSONResponse:
    """Handle model not available errors"""
    logger.warning(
        "model_not_available",
        tenant_id=getattr(request.state, "tenant_id", None),
        model=exc.extra.get("model"),
        available_models=exc.extra.get("available_models"),
    )

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=format_error_response(
            message=str(exc), status_code=status.HTTP_400_BAD_REQUEST, extra=exc.extra
        ),
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_error_handler(
    request: Request, exc: SQLAlchemyError
) -> JSONResponse:
    """Handle database errors"""
    logger.error(
        "database_error",
        error=str(exc),
        tenant_id=getattr(request.state, "tenant_id", None),
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=format_error_response(
            message="Database error occurred",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        ),
    )


@app.exception_handler(LLMBackendException)
async def llm_backend_error_handler(
    request: Request, exc: LLMBackendException
) -> JSONResponse:
    """Handle general LLM backend errors"""
    logger.error(
        "llm_backend_error",
        error=str(exc),
        tenant_id=getattr(request.state, "tenant_id", None),
        extra=exc.extra,
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=format_error_response(
            message=str(exc), status_code=exc.status_code, extra=exc.extra
        ),
    )


# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Mount Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/", response_class=HTMLResponse)
async def home():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>LLM Backend API</title>
        <style>
            body {
                font-family: monospace;
                background: #1a1a1a;
                color: #33ff33;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
            }
            pre {
                text-align: center;
                font-size: 14px;
                white-space: pre;
            }
            .links {
                margin-top: 2em;
            }
            a {
                color: #33ff33;
                text-decoration: none;
                margin: 0 1em;
            }
            a:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <pre>
         /\\__/\\
        (=^.^=)   LLM Backend API
        (")(")____/
  
     /\\_/\\
    ( o.o ) Training...
     > ^ <

     🤖 Multi-tenant
     🚀 OpenAI Compatible
     ⚡ High Performance
        </pre>
        <div class="links">
            <a href="/api/docs">📚 API Docs</a>
            <a href="/api/redoc">📖 ReDoc</a>
        </div>
    </body>
    </html>
    """


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
