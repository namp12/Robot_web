from fastapi import APIRouter, Query
from typing import List, Dict, Any, Optional
from app.database.nosql import nosql_db

router = APIRouter(prefix="/nosql", tags=["NoSQL"])

@router.get("/detections", response_model=List[Dict[str, Any]])
async def get_nosql_detections(mission_id: Optional[int] = Query(None, description="Filter by mission ID")):
    """Get AI Object Detection logs from TinyDB NoSQL database."""
    return nosql_db.get_detections(mission_id=mission_id)

@router.get("/errors", response_model=List[Dict[str, Any]])
async def get_nosql_errors(mission_id: Optional[int] = Query(None, description="Filter by mission ID")):
    """Get system error/warning logs from TinyDB NoSQL database."""
    return nosql_db.get_errors(mission_id=mission_id)

@router.post("/detections/test")
async def create_test_detection(mission_id: int = 1, object_name: str = "person", confidence: float = 0.92):
    """Insert a test AI detection entry into NoSQL database."""
    test_data = [{"object_name": object_name, "confidence": confidence, "bbox": [100, 200, 50, 60]}]
    doc_id = nosql_db.insert_detection(mission_id, test_data)
    return {"status": "success", "doc_id": doc_id, "data": test_data}

@router.post("/errors/test")
async def create_test_error(mission_id: int = 1, node: str = "/lidar_node", level: str = "ERROR", message: str = "LiDAR signal lost"):
    """Insert a test error entry into NoSQL database."""
    doc_id = nosql_db.insert_error(mission_id, node, level, message)
    return {"status": "success", "doc_id": doc_id, "message": message}
