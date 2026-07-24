from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.api.router import api_router
from app.websocket import telemetry_ws
from app.ros.ros_manager import ros_manager
from app.database.session import engine
from app.database.base import Base
import app.models.models  # Register all ORM models with Base.metadata


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI Lifespan Manager for Database Table Auto-Creation & ROS2 Node Lifecycle."""
    # Startup: Auto-create SQLite database tables if robot.db doesn't exist yet
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Startup: Initialize ROS2 Manager & Thread Spin
    ros_manager.start()
    yield

    # Shutdown: Cleanly stop ROS2 Manager
    ros_manager.stop()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api and /api/v1 & WebSocket Endpoint
app.include_router(api_router, prefix="/api")
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(telemetry_ws.router)


@app.get("/", tags=["Health"])
async def root():
    """Healthcheck Root Endpoint."""
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """System Health Endpoint."""
    return {"status": "ok"}
