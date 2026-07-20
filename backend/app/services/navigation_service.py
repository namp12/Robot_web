from app.schemas.schemas import NavigationGoalRequest, NavigationStatusResponse


class NavigationService:
    @staticmethod
    async def get_status() -> NavigationStatusResponse:
        return NavigationStatusResponse()

    @staticmethod
    async def send_goal(goal: NavigationGoalRequest) -> dict:
        return {"status": "GOAL_ACCEPTED", "goal": {"x": goal.x, "y": goal.y, "yaw": goal.yaw}}

    @staticmethod
    async def cancel_goal() -> dict:
        return {"status": "GOAL_CANCELLED"}

    @staticmethod
    async def pause() -> dict:
        return {"status": "NAVIGATION_PAUSED"}

    @staticmethod
    async def resume() -> dict:
        return {"status": "NAVIGATION_RESUMED"}


navigation_service = NavigationService()
