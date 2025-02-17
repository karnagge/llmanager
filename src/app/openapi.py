from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

from src.core.config import get_settings
from src.schemas import (
    APIKeyCreate,
    APIKeyResponse,
    ChatCompletionRequest,
    ChatCompletionResponse,
    ErrorResponse,
    HTTPValidationError,
    ModelInfo,
    ModelsResponse,
    TenantCreate,
    TenantResponse,
)

settings = get_settings()


def setup_openapi(app: FastAPI) -> None:
    """Configure OpenAPI schema for the application"""

    def custom_openapi():
        if app.openapi_schema:
            return app.openapi_schema

        openapi_schema = get_openapi(
            title=settings.PROJECT_NAME,
            version=settings.VERSION,
            description="Multi-tenant LLM Backend with OpenAI-compatible API",
            routes=app.routes,
        )

        # Get JSON schemas for all models
        schemas = {
            "TenantResponse": TenantResponse.model_json_schema(),
            "TenantCreate": TenantCreate.model_json_schema(),
            "APIKeyResponse": APIKeyResponse.model_json_schema(),
            "APIKeyCreate": APIKeyCreate.model_json_schema(),
            "ModelInfo": ModelInfo.model_json_schema(),
            "ModelsResponse": ModelsResponse.model_json_schema(),
            "ChatCompletionRequest": ChatCompletionRequest.model_json_schema(),
            "ChatCompletionResponse": ChatCompletionResponse.model_json_schema(),
            "HTTPValidationError": HTTPValidationError.model_json_schema(),
            "ErrorResponse": ErrorResponse.model_json_schema(),
        }

        # Ensure components and schemas exist
        if "components" not in openapi_schema:
            openapi_schema["components"] = {}

        openapi_schema["components"]["schemas"] = {}

        # Add all schemas and their definitions
        for name, schema in schemas.items():
            # Add main schema
            openapi_schema["components"]["schemas"][name] = schema
            # Add definitions if they exist
            if "$defs" in schema:
                for def_name, def_schema in schema["$defs"].items():
                    full_def_name = f"{name}_{def_name}"
                    openapi_schema["components"]["schemas"][full_def_name] = def_schema

        # Security scheme definitions
        openapi_schema["components"]["securitySchemes"] = {
            "ApiKeyAuth": {
                "type": "apiKey",
                "in": "header",
                "name": "X-API-Key",
                "description": "API Key for authentication",
            },
            "TenantId": {
                "type": "apiKey",
                "in": "header",
                "name": "X-Tenant-ID",
                "description": "Tenant ID for multi-tenancy support",
            },
        }

        # Add security requirement to all paths
        openapi_schema["security"] = [{"ApiKeyAuth": [], "TenantId": []}]

        # Store the schema
        app.openapi_schema = openapi_schema
        return app.openapi_schema

    # Set custom OpenAPI function
    app.openapi = custom_openapi
