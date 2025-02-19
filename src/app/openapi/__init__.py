"""OpenAPI schema configuration for the application"""

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

from src.core.config import get_settings
from .models import SCHEMA_MODELS, update_refs
from .examples import SCHEMA_EXAMPLES
from .security import SECURITY_SCHEMES, apply_security_requirements

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
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  -d 'username=admin@example.com&password=admin123'
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

        # Ensure components exist
        if "components" not in openapi_schema:
            openapi_schema["components"] = {}

        openapi_schema["components"]["schemas"] = {}

        # Add all schemas
        for name, schema_model in SCHEMA_MODELS.items():
            schema = schema_model.model_json_schema()
            
            # Extract nested definitions if they exist
            if "$defs" in schema:
                for key, value in schema["$defs"].items():
                    openapi_schema["components"]["schemas"][f"{name}_{key}"] = value

                # Update references in the schema
                update_refs(schema, name)

            # Add examples and descriptions if available
            if name in SCHEMA_EXAMPLES:
                schema.update(SCHEMA_EXAMPLES[name])

            # Add the enhanced schema
            openapi_schema["components"]["schemas"][name] = schema

        # Add security schemes
        openapi_schema["components"]["securitySchemes"] = SECURITY_SCHEMES

        # Apply security requirements to paths
        apply_security_requirements(openapi_schema)

        # Store the schema
        app.openapi_schema = openapi_schema
        return app.openapi_schema

    # Set custom OpenAPI function
    app.openapi = custom_openapi