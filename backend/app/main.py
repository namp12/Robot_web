from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.api.router import api_router
from app.websocket import telemetry_ws
from app.ros.ros_manager import ros_manager
from app.database.session import engine, AsyncSessionLocal
from app.database.base import Base
import app.models.models  # Register all ORM models with Base.metadata
import asyncio
import logging
from sqlalchemy import select
from app.models.models import Robot, Mission
from app.services.blackbox_service import blackbox_service

logger = logging.getLogger("ApplicationMain")

async def seed_default_data():
    """Seed a default robot and mission if the database is empty."""
    async with AsyncSessionLocal() as db:
        try:
            # Check if any robot exists
            result = await db.execute(select(Robot).limit(1))
            robot = result.scalars().first()
            if not robot:
                logger.info("🌱 Seeding default robot 'KimQui'...")
                robot = Robot(
                    id=1,
                    robot_name="KimQui",
                    serial_number="KQ-001",
                    model="ROS2-Humble",
                    description="Real-time Autonomous Patrol Robot"
                )
                db.add(robot)
                await db.commit()

            # Check if any mission exists
            result = await db.execute(select(Mission).limit(1))
            mission = result.scalars().first()
            if not mission:
                logger.info("🌱 Seeding default mission 'Default_Patrol'...")
                mission = Mission(
                    id=1,
                    robot_id=1,
                    mission_name="Default_Patrol",
                    status="RUNNING",
                    note="Automatically generated for logging"
                )
                db.add(mission)
                await db.commit()
        except Exception as e:
            logger.error(f"Error during default data seeding: {e}")


async def auto_blackbox_logger():
    """Background loop logging telemetry snapshots to SQLite every 5 seconds."""
    logger.info("⏳ Starting background Auto-BlackBox logger (5s interval)...")
    while True:
        try:
            await asyncio.sleep(5.0)
            async with AsyncSessionLocal() as db:
                # Check if default mission exists
                result = await db.execute(select(Mission).where(Mission.id == 1))
                mission = result.scalar_one_or_none()
                if mission:
                    await blackbox_service.record_telemetry_snapshot(db, mission_id=1, event="AUTO_LOG")
        except Exception as e:
            logger.error(f"Error in auto_blackbox_logger loop: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI Lifespan Manager for Database Table Auto-Creation & ROS2 Node Lifecycle."""
    # Startup: Auto-create SQLite database tables if robot.db doesn't exist yet
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default data to prevent foreign key errors on auto-logging
    await seed_default_data()

    # Startup: Initialize ROS2 Manager & Thread Spin
    ros_manager.start()

    # Start the background logger task
    logger_task = asyncio.create_task(auto_blackbox_logger())

    yield

    # Shutdown: Cleanly stop ROS2 Manager and cancel logger task
    ros_manager.stop()
    logger_task.cancel()


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
