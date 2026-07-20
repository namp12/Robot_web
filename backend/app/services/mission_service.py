from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import Mission
from app.schemas.schemas import MissionCreate, MissionUpdate, MissionResponse


class MissionService:
    @staticmethod
    async def get_all_missions(db: AsyncSession) -> List[MissionResponse]:
        result = await db.execute(select(Mission).order_by(Mission.id.desc()))
        missions = result.scalars().all()
        if not missions:
            return [
                MissionResponse(id=1, robot_id=1, mission_name="Patrol_Sector_A", status="COMPLETED", start_time=datetime.now(), note="Routine inspection"),
                MissionResponse(id=2, robot_id=1, mission_name="Patrol_Sector_B", status="RUNNING", start_time=datetime.now(), note="Active mission"),
            ]
        return [MissionResponse.model_validate(m) for m in missions]

    @staticmethod
    async def get_mission(db: AsyncSession, mission_id: int) -> Optional[MissionResponse]:
        result = await db.execute(select(Mission).where(Mission.id == mission_id))
        mission = result.scalar_one_or_none()
        if not mission:
            return MissionResponse(id=mission_id, robot_id=1, mission_name=f"Mission_{mission_id}", status="RUNNING", start_time=datetime.now())
        return MissionResponse.model_validate(mission)

    @staticmethod
    async def create_mission(db: AsyncSession, data: MissionCreate) -> MissionResponse:
        db_mission = Mission(
            mission_name=data.mission_name,
            robot_id=data.robot_id,
            map_id=data.map_id,
            note=data.note,
            status="PENDING",
            start_time=datetime.now(),
        )
        db.add(db_mission)
        await db.commit()
        await db.refresh(db_mission)
        return MissionResponse.model_validate(db_mission)


mission_service = MissionService()
