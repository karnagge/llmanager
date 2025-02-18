from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

from src.core.config import get_settings
from src.schemas import (
    APIKeyCreate,
    # API Key schemas
    APIKeyResponse,
    ChatCompletionChoice,
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatCompletionUsage,
    # Chat schemas
    ChatMessage,
    ErrorResponse,
    # Error schemas
    HTTPValidationError,
    # Model schemas
    ModelInfo,
    ModelsResponse,
    TenantCreate,
    # Tenant schemas
    TenantResponse,
    TenantUpdate,
    Token,
    TokenData,
    # User schemas
    UserCreate,
    UserResponse,
    UserUpdate,
    # Webhook schemas
    WebhookCreate,
    WebhookResponse,
    WebhookUpdate,
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
            description="""
Multi-tenant LLM Backend with OpenAI-compatible API

Authentication is handled via API keys that identify both the tenant and user.
Simply include your API key in the X-API-Key header for all requests.

Example:
```bash
curl -X POST http://localhost:8000/api/v1/chat/completions \\
  -H "X-API-Key: your_api_key" \\
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```
            """,
            routes=app.routes,
            servers=[{"url": "/"}],
        )

        # Get all schema models
        schema_models = {
            # User schemas
            "UserCreate": UserCreate,
            "UserUpdate": UserUpdate,
            "UserResponse": UserResponse,
            "Token": Token,
            "TokenData": TokenData,
            # Tenant schemas
            "TenantCreate": TenantCreate,
            "TenantUpdate": TenantUpdate,
            "TenantResponse": TenantResponse,
            # API Key schemas
            "APIKeyCreate": APIKeyCreate,
            "APIKeyResponse": APIKeyResponse,
            # Webhook schemas
            "WebhookCreate": WebhookCreate,
            "WebhookUpdate": WebhookUpdate,
            "WebhookResponse": WebhookResponse,
            # Model schemas
            "ModelInfo": ModelInfo,
            "ModelsResponse": ModelsResponse,
            # Chat schemas
            "ChatMessage": ChatMessage,
            "ChatCompletionRequest": ChatCompletionRequest,
            "ChatCompletionResponse": ChatCompletionResponse,
            "ChatCompletionChoice": ChatCompletionChoice,
            "ChatCompletionUsage": ChatCompletionUsage,
            # Error schemas
            "HTTPValidationError": HTTPValidationError,
            "ErrorResponse": ErrorResponse,
        }

        # Ensure components exist
        if "components" not in openapi_schema:
            openapi_schema["components"] = {}

        openapi_schema["components"]["schemas"] = {}

        # Add all schemas
        for name, schema_model in schema_models.items():
            schema = schema_model.model_json_schema()
            # Extract nested definitions if they exist
            if "$defs" in schema:
                for key, value in schema["$defs"].items():
                    openapi_schema["components"]["schemas"][f"{name}_{key}"] = value

                # Update references in the schema
                def update_refs(obj):
                    if isinstance(obj, dict):
                        for k, v in obj.items():
                            if k == "$ref" and "#/$defs/" in v:
                                ref_name = v.split("/")[-1]
                                obj[k] = f"#/components/schemas/{name}_{ref_name}"
                            else:
                                update_refs(v)
                    elif isinstance(obj, list):
                        for item in obj:
                            update_refs(item)

                update_refs(schema)

            # Add the main schema
            openapi_schema["components"]["schemas"][name] = schema

        # Security scheme definition
        openapi_schema["components"]["securitySchemes"] = {
            "ApiKeyAuth": {
                "type": "apiKey",
                "in": "header",
                "name": "X-API-Key",
                "description": "API Key for authentication and tenant/user identification",
            }
        }

        # Add security requirements to paths that need authentication
        for path in openapi_schema["paths"].values():
            for operation in path.values():
                # Skip security for health check endpoint
                if operation.get("tags") and "System" in operation["tags"]:
                    continue

                # Add security for protected endpoints
                if (
                    "parameters" in operation
                    and any(
                        param.get("name") == "X-API-Key"
                        for param in operation["parameters"]
                    )
                ) or (
                    operation.get("tags")
                    and any(
                        tag in ["LLM API", "Admin", "User Management"]
                        for tag in operation["tags"]
                    )
                ):
                    operation["security"] = [{"ApiKeyAuth": []}]

        # Store the schema
        app.openapi_schema = openapi_schema
        return app.openapi_schema

    # Set custom OpenAPI function
    app.openapi = custom_openapi
