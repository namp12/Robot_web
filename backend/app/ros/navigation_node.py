import time
import logging
from app.ros.robot_status import telemetry_store

logger = logging.getLogger("ROS2NavigationHandler")

try:
    import rclpy
    from rclpy.action import ActionClient
    from nav2_msgs.action import NavigateToPose
    from geometry_msgs.msg import PoseStamped
    RCLPY_AVAILABLE = True
except ImportError:
    RCLPY_AVAILABLE = False


class NavigationNodeHandler:
    """Handler for Nav2 Action Client (NavigateToPose) & Navigation Goal Management with Reconnection Retry."""

    def __init__(self, node=None):
        self.node = node
        self._action_client = None
        self._active_goal_handle = None
        self._reconnect_retries = 3

        if RCLPY_AVAILABLE and self.node:
            self._action_client = ActionClient(self.node, NavigateToPose, 'navigate_to_pose')

    def send_goal(self, x: float, y: float, yaw: float = 0.0):
        """Send target goal coordinates to ROS2 Nav2 Action Server with retry loop."""
        logger.info(f"🎯 [Nav2 Action Client] Sending Navigation Goal: x={x}, y={y}, yaw={yaw}")
        telemetry_store.update_navigation(status="NAVIGATING", goal_x=x, goal_y=y, goal_yaw=yaw)

        if not RCLPY_AVAILABLE or not self._action_client:
            logger.warning("[Nav2 Action Client] Fallback mode: Simulated goal accepted.")
            return {"status": "GOAL_ACCEPTED", "goal": {"x": x, "y": y, "yaw": yaw}}

        # Retry loop if server is not immediately online
        server_ready = False
        for attempt in range(self._reconnect_retries):
            if self._action_client.wait_for_server(timeout_sec=1.0):
                server_ready = True
                break
            logger.warning(f"⚠️ Nav2 Action Server not ready. Retry attempt {attempt + 1}/{self._reconnect_retries}...")
            time.sleep(0.5)

        if not server_ready:
            logger.error("❌ [Nav2 Action Client] NavigateToPose action server offline after retries!")
            telemetry_store.update_navigation(status="FAILED")
            return {"status": "SERVER_UNAVAILABLE", "message": "Nav2 Action server offline after retries"}

        goal_msg = NavigateToPose.Goal()
        goal_msg.pose = PoseStamped()
        goal_msg.pose.header.frame_id = 'map'
        goal_msg.pose.header.stamp = self.node.get_clock().now().to_msg()
        goal_msg.pose.pose.position.x = float(x)
        goal_msg.pose.pose.position.y = float(y)

        # Send goal async
        send_goal_future = self._action_client.send_goal_async(
            goal_msg,
            feedback_callback=self._feedback_callback
        )
        send_goal_future.add_done_callback(self._goal_response_callback)
        return {"status": "GOAL_DISPATCHED", "goal": {"x": x, "y": y, "yaw": yaw}}

    def _goal_response_callback(self, future):
        goal_handle = future.result()
        if not goal_handle.accepted:
            logger.warning("❌ [Nav2 Action Client] Navigation Goal rejected by Nav2!")
            telemetry_store.update_navigation(status="REJECTED")
            return

        logger.info("✅ [Nav2 Action Client] Navigation Goal accepted by Nav2!")
        self._active_goal_handle = goal_handle
        get_result_future = goal_handle.get_result_async()
        get_result_future.add_done_callback(self._result_callback)

    def _feedback_callback(self, feedback_msg):
        feedback = feedback_msg.feedback
        current_pose = feedback.current_pose.pose
        logger.debug(f"Nav2 Feedback: current_x={current_pose.position.x}, current_y={current_pose.position.y}")

    def _result_callback(self, future):
        result = future.result()
        status = result.status
        logger.info(f"🏁 [Nav2 Action Client] Navigation completed with status code: {status}")
        telemetry_store.update_navigation(status="REACHED" if status == 4 else "FAILED")

    def cancel_goal(self):
        """Cancel active navigation goal."""
        logger.info("🛑 [Nav2 Action Client] Cancelling Active Navigation Goal...")
        telemetry_store.update_navigation(status="CANCELLED")
        if self._active_goal_handle:
            self._active_goal_handle.cancel_goal_async()
            self._active_goal_handle = None
        return {"status": "GOAL_CANCELLED"}


navigation_handler = NavigationNodeHandler()
