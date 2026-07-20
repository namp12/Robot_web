from typing import List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import BlackBox
from app.schemas.schemas import BlackBoxResponse
from app.ros.robot_status import telemetry_store


class BlackBoxService:
    @staticmethod
    async def get_logs(db: AsyncSession) -> List[BlackBoxResponse]:
        """Query real BlackBox records from SQLite database."""
        result = await db.execute(select(BlackBox).order_by(BlackBox.id.desc()).limit(100))
        records = result.scalars().all()
        if not records:
            # Fallback mock data if DB has no records yet
            snapshot = telemetry_store.get_snapshot()
            return [
                BlackBoxResponse(
                    id=1,
                    mission_id=1,
                    timestamp=datetime.now(),
                    pos_x=snapshot["pose"]["x"],
                    pos_y=snapshot["pose"]["y"],
                    yaw=snapshot["pose"]["yaw"],
                    battery=snapshot["battery"],
                    cpu=snapshot["cpu"],
                    ram=snapshot["ram"],
                    wifi_signal=snapshot["wifi_signal"],
                    event="PATROL_STARTED"
                ),
            ]
        return [BlackBoxResponse.model_validate(r) for r in records]

    @staticmethod
    async def get_mission_logs(db: AsyncSession, mission_id: int) -> List[BlackBoxResponse]:
        """Query mission-specific BlackBox records from SQLite database."""
        result = await db.execute(
            select(BlackBox).where(BlackBox.mission_id == mission_id).order_by(BlackBox.id.desc())
        )
        records = result.scalars().all()
        if not records:
            snapshot = telemetry_store.get_snapshot()
            return [
                BlackBoxResponse(
                    id=10,
                    mission_id=mission_id,
                    timestamp=datetime.now(),
                    pos_x=snapshot["pose"]["x"],
                    pos_y=snapshot["pose"]["y"],
                    yaw=snapshot["pose"]["yaw"],
                    battery=snapshot["battery"],
                    cpu=snapshot["cpu"],
                    ram=snapshot["ram"],
                    event="MISSION_RECORD"
                ),
            ]
        return [BlackBoxResponse.model_validate(r) for r in records]

    @staticmethod
    async def record_telemetry_snapshot(db: AsyncSession, mission_id: int = 1, event: str = "LOG"):
        """Save a real-time ROS2 telemetry snapshot into SQLite blackbox table."""
        snapshot = telemetry_store.get_snapshot()
        entry = BlackBox(
            mission_id=mission_id,
            pos_x=snapshot["pose"]["x"],
            pos_y=snapshot["pose"]["y"],
            yaw=snapshot["pose"]["yaw"],
            linear_speed=snapshot["linear_speed"],
            angular_speed=snapshot["angular_speed"],
            battery=snapshot["battery"],
            cpu=snapshot["cpu"],
            ram=snapshot["ram"],
            wifi_signal=snapshot["wifi_signal"],
            event=event
        )
        db.add(entry)
        await db.commit()
        await db.refresh(entry)
        return BlackBoxResponse.model_validate(entry)


blackbox_service = BlackBoxService()
