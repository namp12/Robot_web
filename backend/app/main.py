from contextlib import asynccontextmanager
from datetime import datetime
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
from app.models.models import Robot, Mission, SystemLog, PatrolSchedule
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


async def auto_system_logger():
    """Background loop logging system resources to SQLite every 10 seconds."""
    logger.info("⏳ Starting background Auto-System logger (10s interval)...")
    try:
        import psutil
        HAS_PSUTIL = True
    except ImportError:
        HAS_PSUTIL = False

    while True:
        try:
            await asyncio.sleep(10.0)
            if HAS_PSUTIL:
                cpu = psutil.cpu_percent()
                ram = psutil.virtual_memory().percent
                disk = psutil.disk_usage('/').percent
                cpu_temp = None
                try:
                    temps = psutil.sensors_temperatures()
                    if 'cpu_thermal' in temps:
                        cpu_temp = temps['cpu_thermal'][0].current
                    elif 'coretemp' in temps:
                        cpu_temp = temps['coretemp'][0].current
                except Exception:
                    pass
            else:
                # Fallback to telemetry store snapshot or random mockup
                from app.ros.robot_status import telemetry_store
                snap = telemetry_store.get_snapshot()
                cpu = snap.get("cpu", 34.5)
                ram = snap.get("ram", 52.5)
                disk = 23.1
                cpu_temp = snap.get("temperature", 48.5)

            async with AsyncSessionLocal() as db:
                log_entry = SystemLog(
                    cpu=cpu,
                    ram=ram,
                    disk=disk,
                    cpu_temperature=cpu_temp,
                    gpu_temperature=None
                )
                db.add(log_entry)
                await db.commit()
        except Exception as e:
            logger.error(f"Error in auto_system_logger loop: {e}")


async def auto_patrol_scheduler():
    """Checks scheduled patrols every 30 seconds and starts active ones."""
    logger.info("⏳ Starting background Auto-Patrol Scheduler (30s interval)...")
    while True:
        try:
            await asyncio.sleep(30.0)
            now = datetime.now()
            current_time_str = now.strftime("%H:%M")
            day_map = {0: "Mon", 1: "Tue", 2: "Wed", 3: "Thu", 4: "Fri", 5: "Sat", 6: "Sun"}
            current_day = day_map[now.weekday()]
            
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(PatrolSchedule).where(PatrolSchedule.active == 1))
                schedules = result.scalars().all()
                for s in schedules:
                    try:
                        sched_days = [d.strip() for d in s.days.split(",") if d.strip()]
                        
                        # Match scheduled time and current day of the week
                        if current_time_str == s.start_time and current_day in sched_days:
                            logger.info(f"⏰ Triggered active patrol schedule: '{s.name}' (ID: {s.id})")
                            
                            # Create a running mission record for history tracing
                            db_mission = Mission(
                                robot_id=1,
                                mission_name=f"Patrol_{s.name}",
                                status="RUNNING",
                                note=f"Kích hoạt tự động từ Lịch trình ID: {s.id}"
                            )
                            db.add(db_mission)
                            await db.commit()
                            
                            # Log/dispatch waypoints sequentially to Nav2
                            import json
                            wps = json.loads(s.waypoints)
                            for wp in wps:
                                logger.info(f"[Nav2 Auto Dispatch] Waypoint '{wp.get('name')}' -> (x={wp.get('x')}, y={wp.get('y')})")
                    except Exception as e:
                        logger.error(f"Error executing schedule {s.id}: {e}")
        except Exception as e:
            logger.error(f"Error in auto_patrol_scheduler: {e}")


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

    # Start background tasks
    blackbox_logger_task = asyncio.create_task(auto_blackbox_logger())
    system_logger_task = asyncio.create_task(auto_system_logger())
    patrol_scheduler_task = asyncio.create_task(auto_patrol_scheduler())

    yield

    # Shutdown: Cleanly stop ROS2 Manager and cancel tasks
    ros_manager.stop()
    blackbox_logger_task.cancel()
    system_logger_task.cancel()
    patrol_scheduler_task.cancel()


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
