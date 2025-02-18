from fastapi import APIRouter, Depends, HTTPException

from src.core.auth import get_current_tenant_and_key
from src.core.database import get_tenant_db_session
from src.core.logging import get_logger
from src.models.system import APIKey, Tenant
from src.schemas import (
    ChatCompletionChoice,
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatCompletionUsage,
    ChatMessage,
    ModelInfo,
    ModelsResponse,
)
from src.services.model import get_model_service
from src.services.quota import get_quota_service

logger = get_logger(__name__)
router = APIRouter()


@router.post("/chat/completions", response_model=ChatCompletionResponse)
async def create_chat_completion(
    request: ChatCompletionRequest,
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
) -> ChatCompletionResponse:
    """Create a chat completion"""
    tenant, api_key = tenant_key

    logger.debug(
        "chat_completion_request",
        tenant_id=tenant.id,
        model=request.model,
        message_count=len(request.messages),
        user_id=request.user,
    )

    # Get services
    try:
        model_service = await get_model_service()
        quota_service = await get_quota_service()

        if not model_service.providers:
            raise HTTPException(
                status_code=500,
                detail="No model providers configured. Check your OpenAI API key configuration.",
            )

    except Exception as e:
        logger.error("service_initialization_error", error=str(e), tenant_id=tenant.id)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize services: {str(e)}",
        )

    # Use system database for tenant operations
    async with get_tenant_db_session("system") as session:
        try:
            # Count tokens in the request
            input_tokens = await model_service.count_tokens(
                [msg.dict() for msg in request.messages], request.model
            )
            logger.debug("token_count", tenant_id=tenant.id, input_tokens=input_tokens)

            # Check quota before processing
            await quota_service.check_quota(
                tenant.id, request.user or "default", input_tokens, session
            )

            # Generate completion
            result = await model_service.generate(
                [msg.dict() for msg in request.messages],
                model=request.model,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
            )

            # Update usage tracking
            try:
                await quota_service.update_usage(
                    tenant_id=tenant.id,
                    user_id=request.user or "default",
                    prompt_tokens=result["usage"]["prompt_tokens"],
                    completion_tokens=result["usage"]["completion_tokens"],
                    model=request.model,
                    request_id=api_key.id,
                    metadata={
                        "temperature": request.temperature,
                        "max_tokens": request.max_tokens,
                        "api_key_id": api_key.id,
                    },
                    session=session,
                )
                logger.debug(
                    "usage_updated",
                    tenant_id=tenant.id,
                    user_id=request.user or "default",
                    token_usage=result["usage"],
                )
            except Exception as e:
                logger.error(
                    "usage_update_error",
                    error=str(e),
                    tenant_id=tenant.id,
                    user_id=request.user or "default",
                )
                # Continue since we have the model response
                # but log the error for investigation

            return ChatCompletionResponse(
                id=f"chatcmpl-{api_key.id}",
                created=int(result.get("created", 0)),
                model=request.model,
                choices=[
                    ChatCompletionChoice(
                        index=0,
                        message=ChatMessage(
                            role="assistant", content=result["content"]
                        ),
                        finish_reason="stop",
                    )
                ],
                usage=ChatCompletionUsage(
                    prompt_tokens=result["usage"]["prompt_tokens"],
                    completion_tokens=result["usage"]["completion_tokens"],
                    total_tokens=result["usage"]["total_tokens"],
                ),
            )

        except Exception as e:
            logger.error(
                "chat_completion_error",
                error=str(e),
                tenant_id=tenant.id,
                user_id=request.user or "default",
                error_type=e.__class__.__name__,
            )
            raise HTTPException(
                status_code=500, detail=f"Chat completion failed: {str(e)}"
            )


@router.get("/models", response_model=ModelsResponse)
async def list_models(
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
) -> ModelsResponse:
    """List available models"""
    tenant, _ = tenant_key

    # Get available models based on tenant configuration
    models = [
        ModelInfo(
            id="gpt-4",
            created=1687882410,
            owned_by="openai",
            permission=[],
            root="gpt-4",
            parent=None,
        ),
        ModelInfo(
            id="gpt-3.5-turbo",
            created=1677649963,
            owned_by="openai",
            permission=[],
            root="gpt-3.5-turbo",
            parent=None,
        ),
    ]

    return ModelsResponse(data=models)


@router.get("/models/{model}", response_model=ModelInfo)
async def retrieve_model(
    model: str, tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key)
) -> ModelInfo:
    """Retrieve model information"""
    tenant, _ = tenant_key

    # This could be customized based on tenant settings
    models = {
        "gpt-4": ModelInfo(
            id="gpt-4",
            created=1687882410,
            owned_by="openai",
            permission=[],
            root="gpt-4",
            parent=None,
        ),
        "gpt-3.5-turbo": ModelInfo(
            id="gpt-3.5-turbo",
            created=1677649963,
            owned_by="openai",
            permission=[],
            root="gpt-3.5-turbo",
            parent=None,
        ),
    }

    if model not in models:
        raise HTTPException(status_code=404, detail=f"Model {model} not found")

    return models[model]
