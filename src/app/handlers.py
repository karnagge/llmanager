from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from src.core.exceptions import (
    InvalidAPIKeyError,
    LLMBackendException,
    ModelNotAvailableError,
    QuotaExceededError,
    RateLimitExceededError,
)
from src.core.logging import get_logger
from src.core.utils import format_error_response

logger = get_logger(__name__)


def setup_exception_handlers(app: FastAPI) -> None:
    """Configure exception handlers for the application"""

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
                message=str(exc),
                status_code=status.HTTP_400_BAD_REQUEST,
                extra=exc.extra,
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
