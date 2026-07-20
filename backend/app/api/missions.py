from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.schemas import MissionCreate, MissionUpdate, MissionResponse
from app.services.mission_service import mission_service

router = APIRouter(prefix="/missions", tags=["Missions"])


@router.get("", response_model=List[MissionResponse])
async def list_missions(db: AsyncSession = Depends(get_db)):
    return await mission_service.get_all_missions(db)


@router.get("/{id}", response_model=MissionResponse)
async def get_mission(id: int, db: AsyncSession = Depends(get_db)):
    return await mission_service.get_mission(db, id)


@router.post("", response_model=MissionResponse)
async def create_mission(data: MissionCreate, db: AsyncSession = Depends(get_db)):
    return await mission_service.create_mission(db, data)


@router.put("/{id}", response_model=MissionResponse)
async def update_mission(id: int, data: MissionUpdate, db: AsyncSession = Depends(get_db)):
    mission = await mission_service.get_mission(db, id)
    return mission


@router.delete("/{id}")
async def delete_mission(id: int):
    return {"status": "DELETED", "id": id}
