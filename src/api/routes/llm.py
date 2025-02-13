from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from src.core.auth import get_current_tenant_and_key
from src.core.database import get_tenant_db_session
from src.models.system import APIKey, Tenant
from src.services.model import get_model_service
from src.services.quota import get_quota_service

router = APIRouter()


class Message(BaseModel):
    """Chat message"""

    role: str = Field(..., description="The role of the message sender")
    content: str = Field(..., description="The message content")


class ChatCompletionRequest(BaseModel):
    """Chat completion request following OpenAI's format"""

    model: str = Field(..., description="ID of the model to use")
    messages: List[Message] = Field(
        ..., description="List of messages in the conversation"
    )
    temperature: Optional[float] = Field(0.7, description="Sampling temperature")
    max_tokens: Optional[int] = Field(None, description="Maximum tokens to generate")
    stream: Optional[bool] = Field(False, description="Whether to stream responses")
    user: Optional[str] = Field(None, description="End-user identifier")


class Usage(BaseModel):
    """Token usage information"""

    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ChatCompletionResponse(BaseModel):
    """Chat completion response following OpenAI's format"""

    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[Dict[str, Any]]
    usage: Usage


class ModelsResponse(BaseModel):
    """Available models response"""

    object: str = "list"
    data: List[Dict[str, Any]]


@router.post("/chat/completions", response_model=ChatCompletionResponse)
async def create_chat_completion(
    request: ChatCompletionRequest,
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
) -> ChatCompletionResponse:
    """Create a chat completion"""
    tenant, api_key = tenant_key

    # Get services
    model_service = await get_model_service()
    quota_service = await get_quota_service()

    async with get_tenant_db_session(tenant.id) as session:
        # Count tokens in the request
        input_tokens = await model_service.count_tokens(
            [msg.dict() for msg in request.messages], request.model
        )

        # Check quota before processing
        await quota_service.check_quota(
            tenant.id, request.user or "default", input_tokens, session
        )

        try:
            # Generate completion
            result = await model_service.generate(
                [msg.dict() for msg in request.messages],
                model=request.model,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
            )

            # Update usage
            await quota_service.update_usage(
                tenant_id=tenant.id,
                user_id=request.user or "default",
                prompt_tokens=result["usage"]["prompt_tokens"],
                completion_tokens=result["usage"]["completion_tokens"],
                model=request.model,
                request_id=api_key.id,  # Using API key ID as request ID
                metadata={
                    "temperature": request.temperature,
                    "max_tokens": request.max_tokens,
                    "api_key_id": api_key.id,
                },
                session=session,
            )

            return ChatCompletionResponse(
                id=f"chatcmpl-{api_key.id}",
                created=int(result.get("created", 0)),
                model=request.model,
                choices=[
                    {
                        "index": 0,
                        "message": {"role": "assistant", "content": result["content"]},
                        "finish_reason": "stop",
                    }
                ],
                usage=Usage(
                    prompt_tokens=result["usage"]["prompt_tokens"],
                    completion_tokens=result["usage"]["completion_tokens"],
                    total_tokens=result["usage"]["total_tokens"],
                ),
            )

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Model generation failed: {str(e)}"
            )


@router.get("/models", response_model=ModelsResponse)
async def list_models(
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
) -> ModelsResponse:
    """List available models"""
    tenant, _ = tenant_key

    # Get available models based on tenant configuration
    # This could be customized based on tenant settings
    models = [
        {
            "id": "gpt-4",
            "object": "model",
            "created": 1687882410,
            "owned_by": "openai",
            "permission": [],
            "root": "gpt-4",
            "parent": None,
        },
        {
            "id": "gpt-3.5-turbo",
            "object": "model",
            "created": 1677649963,
            "owned_by": "openai",
            "permission": [],
            "root": "gpt-3.5-turbo",
            "parent": None,
        },
    ]

    return ModelsResponse(data=models)


@router.get("/models/{model}")
async def retrieve_model(
    model: str, tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key)
) -> Dict[str, Any]:
    """Retrieve model information"""
    tenant, _ = tenant_key

    # This could be customized based on tenant settings
    models = {
        "gpt-4": {
            "id": "gpt-4",
            "object": "model",
            "created": 1687882410,
            "owned_by": "openai",
        },
        "gpt-3.5-turbo": {
            "id": "gpt-3.5-turbo",
            "object": "model",
            "created": 1677649963,
            "owned_by": "openai",
        },
    }

    if model not in models:
        raise HTTPException(status_code=404, detail=f"Model {model} not found")

    return models[model]
