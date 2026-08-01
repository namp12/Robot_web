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

    # Server settings (FastAPI Web App on Raspberry Pi - Port 8000)
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Local ROS2 & Hardware Endpoints on Raspberry Pi (Zero Port Collisions)
    PI_IP: str = os.getenv("PI_IP", "127.0.0.1")
    ROBOT_WS_URL: str = os.getenv("ROBOT_WS_URL", f"ws://{PI_IP}:8090")
    PI_COMMAND_URL: str = os.getenv("PI_COMMAND_URL", f"http://{PI_IP}:8001/command")
    CAMERA_STREAM_URL: str = os.getenv("CAMERA_STREAM_URL", f"http://{PI_IP}:8080/video_feed")

    model_config = ConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()

