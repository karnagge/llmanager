from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import HTMLResponse


def setup_views(app: FastAPI) -> None:
    """Configure basic views for the application"""

    @app.get("/", response_class=HTMLResponse)
    async def home():
        """Render home page"""
        template_path = Path(__file__).parent.parent / "templates" / "home.html"
        return template_path.read_text()

    @app.get("/health")
    async def health_check():
        """Health check endpoint"""
        return {"status": "healthy"}
