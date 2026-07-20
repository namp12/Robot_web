from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.schemas import MapCreate, MapUpdate, MapResponse
from app.services.map_service import map_service

router = APIRouter(tags=["Maps & SLAM"])


@router.get("/maps", response_model=List[MapResponse])
async def list_maps(db: AsyncSession = Depends(get_db)):
    return await map_service.get_all_maps(db)


@router.post("/maps", response_model=MapResponse)
async def create_map(data: MapCreate, db: AsyncSession = Depends(get_db)):
    return await map_service.create_map(db, data)


@router.put("/maps/{id}", response_model=MapResponse)
async def update_map(id: int, data: MapUpdate, db: AsyncSession = Depends(get_db)):
    return MapResponse(id=id, map_name=data.map_name or f"Map_{id}")


@router.delete("/maps/{id}")
async def delete_map(id: int):
    return {"status": "MAP_DELETED", "id": id}


@router.post("/slam/start")
async def start_slam():
    return await map_service.startSLAM()


@router.post("/slam/stop")
async def stop_slam():
    return await map_service.stopSLAM()


@router.post("/slam/save")
async def save_slam(data: dict):
    return await map_service.saveSLAMMap(data.get("map_name", "new_map"))
