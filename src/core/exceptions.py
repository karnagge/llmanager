from typing import Any, Dict, Optional

from fastapi import status


class LLMBackendException(Exception):
    """Base exception for LLM Backend"""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        extra: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.extra = extra or {}
        super().__init__(self.message)


class TenantNotFoundError(LLMBackendException):
    """Raised when tenant is not found"""

    def __init__(self, message: str = "Tenant not found"):
        super().__init__(message=message, status_code=status.HTTP_404_NOT_FOUND)


class TenantNotActiveError(LLMBackendException):
    """Raised when tenant is not active"""

    def __init__(self, message: str = "Tenant is not active"):
        super().__init__(message=message, status_code=status.HTTP_403_FORBIDDEN)


class QuotaExceededError(LLMBackendException):
    """Raised when token quota is exceeded"""

    def __init__(
        self,
        message: str = "Token quota exceeded",
        quota_limit: int = 0,
        current_usage: int = 0,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            extra={"quota_limit": quota_limit, "current_usage": current_usage},
        )


class RateLimitExceededError(LLMBackendException):
    """Raised when rate limit is exceeded"""

    def __init__(self, message: str = "Rate limit exceeded", retry_after: int = 0):
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            extra={"retry_after": retry_after},
        )


class InvalidAPIKeyError(LLMBackendException):
    """Raised when API key is invalid"""

    def __init__(self, message: str = "Invalid API key"):
        super().__init__(message=message, status_code=status.HTTP_401_UNAUTHORIZED)


class ModelNotAvailableError(LLMBackendException):
    """Raised when requested model is not available"""

    def __init__(
        self,
        message: str = "Model not available",
        model: str = "",
        available_models: list = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            extra={"model": model, "available_models": available_models or []},
        )


class WebhookDeliveryError(LLMBackendException):
    """Raised when webhook delivery fails"""

    def __init__(
        self,
        message: str = "Webhook delivery failed",
        webhook_id: str = "",
        attempts: int = 0,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            extra={"webhook_id": webhook_id, "attempts": attempts},
        )


class DatabaseError(LLMBackendException):
    """Raised when database operation fails"""

    def __init__(
        self,
        message: str = "Database operation failed",
        operation: str = "",
        details: str = "",
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            extra={"operation": operation, "details": details},
        )


class ValidationError(LLMBackendException):
    """Raised when validation fails"""

    def __init__(
        self, message: str = "Validation failed", errors: Dict[str, Any] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            extra={"errors": errors or {}},
        )


class ConfigurationError(LLMBackendException):
    """Raised when configuration is invalid"""

    def __init__(
        self,
        message: str = "Configuration error",
        parameter: str = "",
        details: str = "",
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            extra={"parameter": parameter, "details": details},
        )
