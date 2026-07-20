from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import MapModel
from app.schemas.schemas import MapCreate, MapResponse


class MapService:
    @staticmethod
    async def get_all_maps(db: AsyncSession) -> List[MapResponse]:
        result = await db.execute(select(MapModel))
        maps = result.scalars().all()
        if not maps:
            return [
                MapResponse(id=1, map_name="Lab_Floor_1.yaml", yaml_path="/maps/Lab_Floor_1.yaml", image_path="/maps/Lab_Floor_1.pgm", resolution=0.05, created_at=datetime.now()),
                MapResponse(id=2, map_name="Warehouse_Zone_A.yaml", yaml_path="/maps/Warehouse_Zone_A.yaml", image_path="/maps/Warehouse_Zone_A.pgm", resolution=0.05, created_at=datetime.now()),
            ]
        return [MapResponse.model_validate(m) for m in maps]

    @staticmethod
    async def create_map(db: AsyncSession, data: MapCreate) -> MapResponse:
        db_map = MapModel(
            map_name=data.map_name,
            yaml_path=data.yaml_path,
            image_path=data.image_path,
            description=data.description,
            resolution=data.resolution,
        )
        db.add(db_map)
        await db.commit()
        await db.refresh(db_map)
        return MapResponse.model_validate(db_map)


map_service = MapService()
