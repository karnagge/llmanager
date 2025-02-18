import logging
import sys
from typing import Any, Dict

import structlog
from pythonjsonlogger import jsonlogger

# Initialize with default log level
root_logger = logging.getLogger()
root_logger.handlers = []

# Configure JSON formatter
json_formatter = jsonlogger.JsonFormatter(
    fmt="%(asctime)s %(levelname)s %(name)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# Configure console handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(json_formatter)

# Set default log level
root_logger.setLevel(logging.INFO)
root_logger.addHandler(console_handler)


def setup_logging(log_level: str = "INFO") -> None:
    """Configure structured logging for the application"""
    # Update log level if provided
    root_logger.setLevel(getattr(logging, log_level.upper()))

    # Configure structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.BoundLogger:
    """Get a logger instance with the given name"""
    return structlog.get_logger(name)


def log_request_info(
    request_id: str,
    tenant_id: str,
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    extra: Dict[str, Any] = None,
) -> None:
    """Log information about an HTTP request"""
    logger = get_logger("request")

    log_data = {
        "request_id": request_id,
        "tenant_id": tenant_id,
        "method": method,
        "path": path,
        "status_code": status_code,
        "duration_ms": duration_ms,
    }

    if extra:
        log_data.update(extra)

    logger.info("request_processed", **log_data)


def log_token_usage(
    request_id: str,
    tenant_id: str,
    user_id: str,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int,
) -> None:
    """Log information about token usage"""
    logger = get_logger("token_usage")

    logger.info(
        "token_usage",
        request_id=request_id,
        tenant_id=tenant_id,
        user_id=user_id,
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
    )


def log_error(
    error: Exception,
    request_id: str = None,
    tenant_id: str = None,
    extra: Dict[str, Any] = None,
) -> None:
    """Log an error with context information"""
    logger = get_logger("error")

    log_data = {
        "error_type": type(error).__name__,
        "error_message": str(error),
    }

    if request_id:
        log_data["request_id"] = request_id
    if tenant_id:
        log_data["tenant_id"] = tenant_id
    if extra:
        log_data.update(extra)

    logger.error("error_occurred", exc_info=error, **log_data)
