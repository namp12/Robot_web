from fastapi import APIRouter
from app.api import robot, missions, maps, blackbox, system, ai, camera, navigation, nosql_api, schedules, mode

api_router = APIRouter()

api_router.include_router(robot.router)
api_router.include_router(missions.router)
api_router.include_router(maps.router)
api_router.include_router(blackbox.router)
api_router.include_router(system.router)
api_router.include_router(ai.router)
api_router.include_router(camera.router)
api_router.include_router(navigation.router)
api_router.include_router(nosql_api.router)
api_router.include_router(schedules.router)
api_router.include_router(mode.router)
