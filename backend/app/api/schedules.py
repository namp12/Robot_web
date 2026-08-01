from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database.session import get_db
from app.models.models import PatrolSchedule
from app.schemas.schemas import PatrolScheduleCreate, PatrolScheduleResponse

router = APIRouter(prefix="/schedules", tags=["patrol-schedules"])

@router.get("", response_model=List[PatrolScheduleResponse])
async def get_all_schedules(db: AsyncSession = Depends(get_db)):
    """List all configured patrol schedules."""
    result = await db.execute(select(PatrolSchedule).order_by(PatrolSchedule.id.desc()))
    schedules = result.scalars().all()
    return schedules

@router.post("", response_model=PatrolScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(data: PatrolScheduleCreate, db: AsyncSession = Depends(get_db)):
    """Create a new patrol schedule."""
    db_sched = PatrolSchedule(
        name=data.name,
        start_time=data.start_time,
        end_time=data.end_time,
        days=data.days,
        waypoints=data.waypoints,
        active=data.active
    )
    db.add(db_sched)
    await db.commit()
    await db.refresh(db_sched)
    return db_sched

@router.put("/{id}", response_model=PatrolScheduleResponse)
async def update_schedule(id: int, data: PatrolScheduleCreate, db: AsyncSession = Depends(get_db)):
    """Update an existing schedule."""
    result = await db.execute(select(PatrolSchedule).where(PatrolSchedule.id == id))
    db_sched = result.scalar_one_or_none()
    if not db_sched:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    db_sched.name = data.name
    db_sched.start_time = data.start_time
    db_sched.end_time = data.end_time
    db_sched.days = data.days
    db_sched.waypoints = data.waypoints
    db_sched.active = data.active
    
    await db.commit()
    await db.refresh(db_sched)
    return db_sched

@router.delete("/{id}")
async def delete_schedule(id: int, db: AsyncSession = Depends(get_db)):
    """Delete a schedule."""
    result = await db.execute(select(PatrolSchedule).where(PatrolSchedule.id == id))
    db_sched = result.scalar_one_or_none()
    if not db_sched:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    await db.delete(db_sched)
    await db.commit()
    return {"status": "DELETED", "id": id}
