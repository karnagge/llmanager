from functools import lru_cache
from typing import List, Optional

from pydantic import PostgresDsn, RedisDsn, SecretStr, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Project settings
    PROJECT_NAME: str = "LLM Backend"
    VERSION: str = "0.1.0"
    DEBUG: bool = False
    SHOW_API_DOCS: bool = True
    LOG_LEVEL: str = "INFO"

    # API Settings
    API_V1_STR: str = "/api/v1"
    CORS_ORIGINS: List[str] = ["*"]

    # Security
    SECRET_KEY: SecretStr
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # Database
    POSTGRES_HOST: str
    POSTGRES_PORT: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: SecretStr
    POSTGRES_DB: str
    DATABASE_URI: Optional[PostgresDsn] = None

    @validator("DATABASE_URI", pre=True)
    def assemble_db_uri(cls, v: Optional[str], values: dict) -> str:
        if v:
            return v
        return PostgresDsn.build(
            scheme="postgresql",
            username=values["POSTGRES_USER"],
            password=values["POSTGRES_PASSWORD"].get_secret_value(),
            host=values["POSTGRES_HOST"],
            port=int(values["POSTGRES_PORT"]),
            path=f"/{values['POSTGRES_DB']}",
        )

    # Redis
    REDIS_HOST: str
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[SecretStr] = None
    REDIS_URI: Optional[RedisDsn] = None

    @validator("REDIS_URI", pre=True)
    def assemble_redis_uri(cls, v: Optional[str], values: dict) -> str:
        if v:
            return v

        auth = ""
        if values.get("REDIS_PASSWORD"):
            auth = f":{values['REDIS_PASSWORD'].get_secret_value()}@"

        return f"redis://{auth}{values['REDIS_HOST']}:{values['REDIS_PORT']}/0"

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_DEFAULT_LIMIT: int = 100
    RATE_LIMIT_DEFAULT_PERIOD: int = 3600  # 1 hour in seconds

    # Token Management
    DEFAULT_TOKEN_QUOTA: int = 100_000
    TOKEN_QUOTA_ALERT_THRESHOLD: float = 0.9  # Alert at 90% usage

    # Model Settings
    DEFAULT_MODEL: str = "gpt-3.5-turbo"
    FALLBACK_MODEL: str = "gpt-3.5-turbo"
    MAX_TOKENS: int = 4096

    # Cloud Provider Settings
    OPENAI_API_KEY: Optional[SecretStr] = None
    AZURE_API_KEY: Optional[SecretStr] = None
    GOOGLE_API_KEY: Optional[SecretStr] = None
    AWS_ACCESS_KEY_ID: Optional[SecretStr] = None
    AWS_SECRET_ACCESS_KEY: Optional[SecretStr] = None

    # Webhook Settings
    WEBHOOK_RETRY_ATTEMPTS: int = 3
    WEBHOOK_RETRY_DELAY: int = 5  # seconds

    # Admin Settings
    ADMIN_EMAIL: str = "admin@example.com"
    ADMIN_PASSWORD: SecretStr

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
