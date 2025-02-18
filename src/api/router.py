from fastapi import APIRouter

from src.api.routes import admin, llm, users
from src.core.logging import get_logger

# Create logger
logger = get_logger(__name__)

# Create main router
api_router = APIRouter()

# Include route modules
api_router.include_router(llm.router, tags=["LLM API"])

api_router.include_router(admin.router, prefix="/admin", tags=["Administration"])

api_router.include_router(users.router, prefix="/users", tags=["User Management"])


# Health check endpoint only (other routes are included from modules)
@api_router.get("/health", tags=["System"])
async def health_check() -> dict:
    """Health check endpoint"""
    return {"status": "healthy", "version": "0.1.0"}


# OpenAPI customization
api_router.title = "LLM Backend API"
api_router.description = "Multi-tenant LLM Backend with OpenAI-compatible API"
api_router.version = "0.1.0"
api_router.docs_url = "/docs"
api_router.redoc_url = "/redoc"
