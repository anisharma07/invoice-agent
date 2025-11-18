from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""

    # AWS Bedrock Configuration
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str = "us-east-1"
    ANTHROPIC_MODEL: str = "us.anthropic.claude-sonnet-4-20250514-v1:0"
    CLAUDE_CODE_USE_BEDROCK: str = "1"

    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None

    # Session Configuration
    SESSION_EXPIRY_SECONDS: int = 3600  # 1 hour
    MAX_TOKEN_LIMIT: int = 200000

    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_file = "../.env"
        case_sensitive = True


settings = Settings()
