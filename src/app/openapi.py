from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

from src.core.config import get_settings
from src.schemas import (
    APIKeyCreate,
    # API Key schemas
    APIKeyResponse,
    # Auth schemas
    LoginData,
    AuthResponse,
    Token,
    TokenData,
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

## Authentication

### Login to Get Access Token and API Key
```bash
# Login with email and password
curl -X POST 'http://localhost:8000/api/v1/auth/login' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "api_key": "llm_YOUR_API_KEY",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

### Using API Key
After obtaining your API key, include it in the X-API-Key header for all requests:
```bash
X-API-Key: llm_YOUR_API_KEY
```

## API Management Examples
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

            # Add examples and descriptions for each schema type
            if name == "LoginData":
                schema["description"] = "User login credentials"
                schema["example"] = {
                    "email": "user@example.com",
                    "password": "yourpassword123"
                }
            elif name == "AuthResponse":
                schema["description"] = "Authentication response with tokens and user data"
                schema["example"] = {
                    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "token_type": "bearer",
                    "api_key": "llm_example_api_key",
                    "user": {
                        "id": "user_123",
                        "email": "user@example.com",
                        "name": "John Doe",
                        "role": "user"
                    }
                }
            elif name == "UserCreate":
                schema["description"] = "Create a new user account"
                schema["example"] = {
                    "email": "user@example.com",
                    "password": "securepassword123",
                    "name": "John Doe"
                }
            elif name == "UserUpdate":
                schema["description"] = "Update an existing user's information"
                schema["example"] = {
                    "name": "John Smith",
                    "quota_limit": 500000,
                    "is_active": True
                }
            elif name == "UserResponse":
                schema["description"] = "User information response"
                schema["example"] = {
                    "id": "user_123",
                    "email": "user@example.com",
                    "name": "John Doe",
                    "is_active": True,
                    "role": "user",
                    "quota_limit": 1000000,
                    "current_quota_usage": 50000
                }
            elif name == "TenantCreate":
                schema["description"] = "Create a new tenant with configuration"
                schema["example"] = {
                    "id": "tenant_123",
                    "name": "Example Corp",
                    "quota_limit": 1000000,
                    "config": {
                        "allowed_models": ["gpt-4", "gpt-3.5-turbo"],
                        "max_tokens": 4000
                    }
                }
            elif name == "TenantUpdate":
                schema["description"] = "Update an existing tenant's configuration"
                schema["example"] = {
                    "name": "Example Corp Updated",
                    "quota_limit": 2000000,
                    "is_active": True,
                    "config": {
                        "allowed_models": ["gpt-4", "gpt-3.5-turbo"],
                        "max_tokens": 8000
                    }
                }
            elif name == "TenantResponse":
                schema["description"] = "Tenant information response"
                schema["example"] = {
                    "id": "tenant_123",
                    "name": "Example Corp",
                    "db_name": "tenant_example_corp",
                    "quota_limit": 1000000,
                    "current_quota_usage": 50000,
                    "is_active": True,
                    "config": {
                        "allowed_models": ["gpt-4", "gpt-3.5-turbo"],
                        "max_tokens": 4000
                    }
                }
            elif name == "APIKeyCreate":
                schema["description"] = "Create a new API key with permissions"
                schema["example"] = {
                    "name": "Development API Key",
                    "permissions": {
                        "models": ["gpt-4", "gpt-3.5-turbo"],
                        "roles": ["user"]
                    },
                    "quota_limit": 100000
                }
            elif name == "APIKeyResponse":
                schema["description"] = "API key information response"
                schema["example"] = {
                    "id": "key_123",
                    "name": "Development API Key",
                    "key": "llm_example_key",
                    "permissions": {
                        "models": ["gpt-4", "gpt-3.5-turbo"],
                        "roles": ["user"]
                    },
                    "quota_limit": 100000,
                    "current_quota_usage": 0
                }
            
            # Add the enhanced schema
            openapi_schema["components"]["schemas"][name] = schema

        # Add form body schema for login
        openapi_schema["components"]["schemas"]["OAuth2PasswordRequestForm"] = {
            "type": "object",
            "properties": {
                "username": {
                    "type": "string",
                    "format": "email",
                    "example": "user@example.com"
                },
                "password": {
                    "type": "string",
                    "format": "password",
                    "example": "yourpassword123"
                }
            },
            "required": ["username", "password"]
        }

        # Security scheme definitions
        openapi_schema["components"]["securitySchemes"] = {
            "ApiKeyAuth": {
                "type": "apiKey",
                "in": "header",
                "name": "X-API-Key",
                "description": "API Key for authentication and tenant/user identification"
            },
            "OAuth2PasswordBearer": {
                "type": "oauth2",
                "flows": {
                    "password": {
                        "tokenUrl": "/api/v1/users/token",
                        "scopes": {}
                    }
                }
            }
        }

        # Add security requirements to paths that need authentication
        for path in openapi_schema["paths"].values():
            for operation in path.values():
                # Skip security for health check endpoint
                if operation.get("tags") and "System" in operation["tags"]:
                    continue

                # Handle security based on endpoint
                path_key = next(iter(operation.get("operationId", "").split("_")), "")
                if path_key == "login":
                    # Login endpoint should not be secured
                    operation["security"] = []
                    # Update request body to use form data
                    if "requestBody" in operation:
                        operation["requestBody"]["content"] = {
                            "application/x-www-form-urlencoded": {
                                "schema": {
                                    "$ref": "#/components/schemas/OAuth2PasswordRequestForm"
                                }
                            }
                        }
                elif (
                    "parameters" in operation
                    and any(param.get("name") == "X-API-Key" for param in operation["parameters"])
                ) or (
                    operation.get("tags")
                    and any(tag in ["LLM API", "Administration", "User Management", "Metrics"] for tag in operation["tags"])
                ):
                    # Protected endpoints require API key
                    operation["security"] = [{"ApiKeyAuth": []}]

        # Store the schema
        app.openapi_schema = openapi_schema
        return app.openapi_schema

    # Set custom OpenAPI function
    app.openapi = custom_openapi
