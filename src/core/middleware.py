import time
import uuid
from contextvars import ContextVar
from typing import Callable

from fastapi import Request, Response
from prometheus_client import Counter, Histogram
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

from src.core.exceptions import TenantNotFoundError
from src.core.logging import log_request_info

# Context variables for request-scoped data
request_id_ctx = ContextVar[str]("request_id", default="")
tenant_id_ctx = ContextVar[str]("tenant_id", default="")

# Prometheus metrics
http_requests_total = Counter(
    "http_requests_total",
    "Total count of HTTP requests",
    ["method", "endpoint", "tenant_id", "status_code"],
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint", "tenant_id"],
)


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Middleware to add a unique request ID to each request"""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        request_id = str(uuid.uuid4())
        request_id_ctx.set(request_id)

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id

        return response


class TenantMiddleware(BaseHTTPMiddleware):
    """Middleware to handle tenant isolation and context"""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Skip tenant check for health check and metrics endpoints
        if request.url.path in ["/health", "/metrics"]:
            return await call_next(request)

        tenant_id = request.headers.get("X-Tenant-ID")
        if not tenant_id:
            raise TenantNotFoundError("Tenant ID not provided in request headers")

        # Set tenant context
        tenant_id_ctx.set(tenant_id)

        # TODO: Validate tenant exists and is active
        # This will be implemented when we add the tenant service

        response = await call_next(request)
        return response


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log request information"""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start_time = time.time()

        response = await call_next(request)

        duration_ms = (time.time() - start_time) * 1000

        # Log request information
        log_request_info(
            request_id=request_id_ctx.get(),
            tenant_id=tenant_id_ctx.get(),
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=duration_ms,
            extra={
                "query_params": str(request.query_params),
                "client_host": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent"),
            },
        )

        return response


class PrometheusMiddleware(BaseHTTPMiddleware):
    """Middleware to collect Prometheus metrics"""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start_time = time.time()

        response = await call_next(request)

        # Record metrics
        duration = time.time() - start_time
        endpoint = request.url.path
        method = request.method
        tenant_id = tenant_id_ctx.get()

        http_requests_total.labels(
            method=method,
            endpoint=endpoint,
            tenant_id=tenant_id,
            status_code=response.status_code,
        ).inc()

        http_request_duration_seconds.labels(
            method=method, endpoint=endpoint, tenant_id=tenant_id
        ).observe(duration)

        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to handle rate limiting"""

    def __init__(
        self,
        app: ASGIApp,
        rate_limit_service: Callable,
    ) -> None:
        super().__init__(app)
        self.rate_limit_service = rate_limit_service

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        tenant_id = tenant_id_ctx.get()

        # Skip rate limiting for health check and metrics endpoints
        if request.url.path in ["/health", "/metrics"]:
            return await call_next(request)

        # Check rate limit
        await self.rate_limit_service(tenant_id)

        response = await call_next(request)
        return response
