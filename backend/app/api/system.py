from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.schemas import SystemResourceResponse
from app.services.system_service import system_service

router = APIRouter(prefix="/system", tags=["System"])


@router.get("", response_model=SystemResourceResponse)
async def get_system_info():
    return await system_service.get_system_info()


@router.get("/logs")
async def get_system_logs(db: AsyncSession = Depends(get_db)):
    return await system_service.get_logs(db)
