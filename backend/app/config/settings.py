import os
from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    """System Application Settings."""

    PROJECT_NAME: str = "Robot Explorer Platform API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # SQLite Async Database URL
    # Refers to database path in project
    DATABASE_URL: str = "sqlite+aiosqlite:///../database/robot.db"

    # CORS Settings
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    model_config = ConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()
