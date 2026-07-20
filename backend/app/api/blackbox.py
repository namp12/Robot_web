from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.schemas import BlackBoxResponse
from app.services.blackbox_service import blackbox_service

router = APIRouter(prefix="/blackbox", tags=["BlackBox"])


@router.get("", response_model=List[BlackBoxResponse])
async def get_blackbox_logs(db: AsyncSession = Depends(get_db)):
    return await blackbox_service.get_logs(db)


@router.get("/{mission_id}", response_model=List[BlackBoxResponse])
async def get_mission_blackbox_logs(mission_id: int, db: AsyncSession = Depends(get_db)):
    return await blackbox_service.get_mission_logs(db, mission_id)


@router.post("/record")
async def record_blackbox_snapshot(mission_id: int = 1, event: str = "MANUAL_SNAPSHOT", db: AsyncSession = Depends(get_db)):
    return await blackbox_service.record_telemetry_snapshot(db, mission_id, event)
