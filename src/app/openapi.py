"""OpenAPI configuration module"""

from fastapi import FastAPI

from src.app.openapi import setup_openapi

__all__ = ["setup_openapi"]
