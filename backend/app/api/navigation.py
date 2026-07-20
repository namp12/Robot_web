from fastapi import APIRouter
from app.schemas.schemas import NavigationGoalRequest, NavigationStatusResponse
from app.services.navigation_service import navigation_service

router = APIRouter(prefix="/navigation", tags=["Navigation"])


@router.get("/status", response_model=NavigationStatusResponse)
async def get_navigation_status():
    return await navigation_service.get_status()


@router.post("/goal")
async def send_goal(goal: NavigationGoalRequest):
    return await navigation_service.send_goal(goal)


@router.post("/cancel")
async def cancel_goal():
    return await navigation_service.cancel_goal()


@router.post("/pause")
async def pause_navigation():
    return await navigation_service.pause()


@router.post("/resume")
async def resume_navigation():
    return await navigation_service.resume()
