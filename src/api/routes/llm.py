from fastapi import APIRouter, Depends, HTTPException

from src.core.auth import get_current_tenant_and_key
from src.core.database import get_tenant_db_session
from src.core.logging import get_logger

logger = get_logger(__name__)
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

router = APIRouter()


@router.post("/chat/completions", response_model=ChatCompletionResponse)
async def create_chat_completion(
    request: ChatCompletionRequest,
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
) -> ChatCompletionResponse:
    """Create a chat completion"""
    tenant, api_key = tenant_key

    # Get services
    try:
        model_service = await get_model_service()
        logger.debug(f"Model service providers: {list(model_service.providers.keys())}")
        if not model_service.providers:
            raise HTTPException(
                status_code=500,
                detail="No model providers configured. Check your OpenAI API key configuration.",
            )

        logger.debug(f"Getting quota service for tenant {tenant.id}")
        quota_service = await get_quota_service()

        # Log tenant details to verify quota_limit
        logger.debug(
            f"Tenant details - ID: {tenant.id}, Name: {tenant.name}, Quota Limit: {tenant.quota_limit}"
        )

        if not hasattr(tenant, "quota_limit"):
            logger.error(f"Tenant {tenant.id} has no quota_limit attribute!")
            raise HTTPException(
                status_code=500,
                detail="Tenant configuration error: missing quota_limit",
            )
    except Exception as e:
        logger.error(f"Failed to initialize services: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize services: {str(e)}",
        )

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
