import uvicorn

from src.app.factory import create_app
from src.core.config import get_settings

settings = get_settings()
app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
