"""Security schema configurations for OpenAPI documentation"""

# Security scheme definitions
SECURITY_SCHEMES = {
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
                "tokenUrl": "/api/v1/auth/login",  # Updated to correct login endpoint
                "scopes": {}
            }
        }
    }
}

def apply_security_requirements(openapi_schema: dict) -> None:
    """Apply security requirements to API paths based on their requirements"""
    for path in openapi_schema["paths"].values():
        for operation in path.values():
            # Skip security for health check endpoint
            if operation.get("tags") and "System" in operation["tags"]:
                continue

            # Handle security based on endpoint
            path_key = next(iter(operation.get("operationId", "").split("_")), "")
            
            if "/api/v1/auth/login" in operation.get("operationId", ""):
                # Login endpoint should not be secured
                operation["security"] = []
                # Update request body to use form data
                if "requestBody" in operation:
                    operation["requestBody"] = {
                        "required": True,
                        "content": {
                            "application/x-www-form-urlencoded": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "username": {"type": "string"},
                                        "password": {"type": "string", "format": "password"}
                                    },
                                    "required": ["username", "password"]
                                }
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