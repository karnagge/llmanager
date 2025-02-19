"""Schema examples and descriptions for OpenAPI documentation"""

SCHEMA_EXAMPLES = {
    "LoginData": {
        "description": "User login credentials",
        "example": {
            "username": "user@example.com",
            "password": "yourpassword123"
        }
    },
    "AuthResponse": {
        "description": "Authentication response with tokens and user data",
        "example": {
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
    },
    "UserCreate": {
        "description": "Create a new user account",
        "example": {
            "email": "user@example.com",
            "password": "securepassword123",
            "name": "John Doe"
        }
    },
    "UserUpdate": {
        "description": "Update an existing user's information",
        "example": {
            "name": "John Smith",
            "quota_limit": 500000,
            "is_active": True
        }
    },
    "UserResponse": {
        "description": "User information response",
        "example": {
            "id": "user_123",
            "email": "user@example.com",
            "name": "John Doe",
            "is_active": True,
            "role": "user",
            "quota_limit": 1000000,
            "current_quota_usage": 50000
        }
    },
    "TenantCreate": {
        "description": "Create a new tenant with configuration",
        "example": {
            "id": "tenant_123",
            "name": "Example Corp",
            "quota_limit": 1000000,
            "config": {
                "allowed_models": ["gpt-4", "gpt-3.5-turbo"],
                "max_tokens": 4000
            }
        }
    },
    "TenantUpdate": {
        "description": "Update an existing tenant's configuration",
        "example": {
            "name": "Example Corp Updated",
            "quota_limit": 2000000,
            "is_active": True,
            "config": {
                "allowed_models": ["gpt-4", "gpt-3.5-turbo"],
                "max_tokens": 8000
            }
        }
    },
    "TenantResponse": {
        "description": "Tenant information response",
        "example": {
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
    },
    "APIKeyCreate": {
        "description": "Create a new API key with permissions",
        "example": {
            "name": "Development API Key",
            "permissions": {
                "models": ["gpt-4", "gpt-3.5-turbo"],
                "roles": ["user"]
            },
            "quota_limit": 100000
        }
    },
    "APIKeyResponse": {
        "description": "API key information response",
        "example": {
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
    }
}