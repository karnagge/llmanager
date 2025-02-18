import traceback
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

import openai.error
from langchain.chat_models import AzureChatOpenAI, ChatOpenAI
from langchain.schema import AIMessage, ChatMessage, HumanMessage, SystemMessage

from src.core.config import get_settings
from src.core.exceptions import ModelNotAvailableError
from src.core.logging import get_logger
from src.models.tenant import ModelProvider

settings = get_settings()
logger = get_logger(__name__)


class BaseModelProvider(ABC):
    """Base class for model providers"""

    @abstractmethod
    async def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """Generate text from the model"""
        pass

    @abstractmethod
    async def count_tokens(self, messages: List[Dict[str, str]], model: str) -> int:
        """Count tokens in the input"""
        pass


class OpenAIProvider(BaseModelProvider):
    """OpenAI API provider"""

    def __init__(self, api_key: str):
        # Set the API key in the environment for LangChain
        import os

        os.environ["OPENAI_API_KEY"] = api_key
        self.client = ChatOpenAI(temperature=0.7, request_timeout=60)

    def _convert_messages(self, messages: List[Dict[str, str]]) -> List[ChatMessage]:
        """Convert dict messages to Langchain format"""
        message_map = {
            "system": SystemMessage,
            "user": HumanMessage,
            "assistant": AIMessage,
        }

        return [message_map[msg["role"]](content=msg["content"]) for msg in messages]

    async def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """Generate text using OpenAI API"""
        try:
            logger.debug(
                "openai_request",
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                message_count=len(messages),
            )

            self.client.model_name = model
            self.client.temperature = temperature
            if max_tokens:
                self.client.max_tokens = max_tokens

            langchain_messages = self._convert_messages(messages)

            try:
                response = await self.client.agenerate([langchain_messages])
            except (
                openai.error.APIError,
                openai.error.Timeout,
                openai.error.RateLimitError,
                openai.error.InvalidRequestError,
                openai.error.AuthenticationError,
                openai.error.ServiceUnavailableError,
            ) as e:
                logger.error(
                    "openai_api_error",
                    error=str(e),
                    error_type=e.__class__.__name__,
                    http_status=getattr(e, "http_status", None),
                    code=getattr(e, "code", None),
                    should_retry=getattr(e, "should_retry", None),
                )
                raise
            except Exception as e:
                logger.error(
                    "openai_unexpected_error",
                    error=str(e),
                    error_type=e.__class__.__name__,
                    traceback=traceback.format_exc(),
                )
                raise

            generation = response.generations[0][0]

            result = {
                "content": generation.text,
                "usage": {
                    "prompt_tokens": response.llm_output["token_usage"][
                        "prompt_tokens"
                    ],
                    "completion_tokens": response.llm_output["token_usage"][
                        "completion_tokens"
                    ],
                    "total_tokens": response.llm_output["token_usage"]["total_tokens"],
                },
            }
            logger.debug("openai_response_success", result=result)
            return result

        except Exception as e:
            logger.error(
                "openai_general_error",
                error=str(e),
                error_type=e.__class__.__name__,
                model=model,
                traceback=traceback.format_exc(),
            )
            raise

    async def count_tokens(self, messages: List[Dict[str, str]], model: str) -> int:
        """Count tokens in the input using tiktoken"""
        langchain_messages = self._convert_messages(messages)
        return self.client.get_num_tokens_from_messages(langchain_messages)


class AzureProvider(BaseModelProvider):
    """Azure OpenAI API provider"""

    def __init__(self, api_key: str, api_base: str, deployment_name: str):
        self.client = AzureChatOpenAI(
            openai_api_key=api_key,
            openai_api_base=api_base,
            deployment_name=deployment_name,
            temperature=0.7,
            request_timeout=60,
        )

    async def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """Generate text using Azure OpenAI API"""
        # Implementation similar to OpenAIProvider
        pass

    async def count_tokens(self, messages: List[Dict[str, str]], model: str) -> int:
        """Count tokens using Azure's implementation"""
        pass


class ModelService:
    """Service for managing model providers and routing requests"""

    def __init__(self):
        self.providers: Dict[ModelProvider, BaseModelProvider] = {}
        self._initialize_providers()

    def _initialize_providers(self) -> None:
        """Initialize configured model providers"""
        # OpenAI
        logger.debug(
            f"Initializing providers, OPENAI_API_KEY present: {bool(settings.OPENAI_API_KEY)}"
        )
        if settings.OPENAI_API_KEY:
            logger.debug("Initializing OpenAI provider")
            try:
                self.providers[ModelProvider.OPENAI] = OpenAIProvider(
                    api_key=settings.OPENAI_API_KEY.get_secret_value()
                )
                logger.debug("OpenAI provider initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI provider: {str(e)}")
                raise

        # Azure
        if settings.AZURE_API_KEY:
            self.providers[ModelProvider.AZURE] = AzureProvider(
                api_key=settings.AZURE_API_KEY.get_secret_value(),
                api_base=settings.AZURE_API_BASE,
                deployment_name=settings.AZURE_DEPLOYMENT_NAME,
            )

    async def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        provider: Optional[ModelProvider] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """Generate text using specified model and provider"""
        if not provider:
            provider = self._get_default_provider(model)

        if provider not in self.providers:
            raise ModelNotAvailableError(
                f"Provider {provider} not configured",
                model=model,
                available_models=list(self.providers.keys()),
            )

        try:
            logger.debug(
                "model_generation_start",
                provider=provider,
                model=model,
                message_count=len(messages),
            )
            result = await self.providers[provider].generate(messages, model, **kwargs)
            logger.debug(
                "model_generation_success",
                provider=provider,
                model=model,
                token_usage=result.get("usage", {}),
            )
            return result
        except Exception as e:
            logger.error(
                "model_generation_error",
                error=str(e),
                error_type=e.__class__.__name__,
                provider=provider,
                model=model,
                traceback=traceback.format_exc(),
            )
            raise

    async def count_tokens(
        self,
        messages: List[Dict[str, str]],
        model: str,
        provider: Optional[ModelProvider] = None,
    ) -> int:
        """Count tokens in the input"""
        if not provider:
            provider = self._get_default_provider(model)

        if provider not in self.providers:
            raise ModelNotAvailableError(
                f"Provider {provider} not configured",
                model=model,
                available_models=list(self.providers.keys()),
            )

        return await self.providers[provider].count_tokens(messages, model)

    def _get_default_provider(self, model: str) -> ModelProvider:
        """Get default provider for a model"""
        return ModelProvider.OPENAI


# Global model service instance
model_service: Optional[ModelService] = None


async def get_model_service() -> ModelService:
    """Get model service instance"""
    global model_service
    if model_service is None:
        model_service = ModelService()
    return model_service
