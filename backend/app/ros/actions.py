import logging
from app.ros.robot_status import telemetry_store

logger = logging.getLogger("ROS2Actions")


class ActionClientsHandler:
    """Action client handler for Nav2 NavigateToPose."""

    def __init__(self, node=None):
        self.node = node

    def send_goal(self, x: float, y: float, yaw: float = 0.0) -> dict:
        logger.info(f"🎯 Dispatching Nav2 Goal Action: x={x}, y={y}, yaw={yaw}")
        telemetry_store.update_navigation("NAVIGATING", goal_x=x, goal_y=y, goal_yaw=yaw)
        return {"status": "GOAL_ACCEPTED", "goal": {"x": x, "y": y, "yaw": yaw}}

    def cancel_goal(self) -> dict:
        logger.info("🛑 Cancelling Nav2 Action Goal")
        telemetry_store.update_navigation("CANCELLED")
        return {"status": "GOAL_CANCELLED"}


actions_handler = ActionClientsHandler()
