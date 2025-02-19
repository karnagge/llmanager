from src.schemas import (
    APIKeyCreate,
    APIKeyResponse,
    LoginData,
    AuthResponse,
    Token,
    TokenData,
    ChatCompletionChoice,
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatCompletionUsage,
    ChatMessage,
    ErrorResponse,
    HTTPValidationError,
    ModelInfo,
    ModelsResponse,
    TenantCreate,
    TenantResponse,
    TenantUpdate,
    UserCreate,
    UserResponse,
    UserUpdate,
    WebhookCreate,
    WebhookResponse,
    WebhookUpdate,
)

# Get all schema models
SCHEMA_MODELS = {
    # Auth schemas
    "LoginData": LoginData,
    "AuthResponse": AuthResponse,
    "Token": Token,
    "TokenData": TokenData,
    # User schemas
    "UserCreate": UserCreate,
    "UserUpdate": UserUpdate,
    "UserResponse": UserResponse,
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

def update_refs(obj, schema_name: str):
    """Update references in the schema to point to the correct components
    
    Args:
        obj: The object to update references in
        schema_name: The name of the schema being processed
    """
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "$ref" and "#/$defs/" in v:
                ref_name = v.split("/")[-1]
                obj[k] = f"#/components/schemas/{schema_name}_{ref_name}"
            else:
                update_refs(v, schema_name)
    elif isinstance(obj, list):
        for item in obj:
            update_refs(item, schema_name)