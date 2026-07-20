import threading
import logging
from app.ros.robot_status import telemetry_store

logger = logging.getLogger("ROS2Manager")

try:
    import rclpy
    from rclpy.executors import MultiThreadedExecutor
    from app.ros.ros_node import RobotBridgeNode
    RCLPY_AVAILABLE = True
except ImportError:
    RCLPY_AVAILABLE = False


class ROS2Manager:
    """Singleton Manager for ROS2 Humble Lifecycle & MultiThreadedExecutor Background Spin Loop."""

    def __init__(self):
        self._thread: threading.Thread | None = None
        self._running: bool = False
        self.node: RobotBridgeNode | None = None
        self.executor: MultiThreadedExecutor | None = None

    def start(self):
        if not RCLPY_AVAILABLE:
            logger.warning("⚠️ [ROS2 Manager] rclpy library is not available. Operating in Fallback/Simulation mode.")
            telemetry_store.update_connection(True)
            return

        if self._running:
            logger.info("ROS2 Manager spin thread is already running.")
            return

        logger.info("🚀 Initializing rclpy and creating node 'robot_web_bridge'...")
        try:
            if not rclpy.ok():
                rclpy.init()

            self.node = RobotBridgeNode(node_name="robot_web_bridge")
            self.executor = MultiThreadedExecutor()
            self.executor.add_node(self.node)

            self._running = True
            self._thread = threading.Thread(target=self._spin_loop, daemon=True)
            self._thread.start()

            telemetry_store.update_connection(True)
            logger.info("✅ [ROS2 Manager] MultiThreadedExecutor background thread started successfully.")
        except Exception as e:
            logger.error(f"❌ Failed to start ROS2 Manager: {e}")

    def _spin_loop(self):
        logger.info("🔄 [ROS2 Manager] MultiThreadedExecutor spin loop active...")
        try:
            while self._running and rclpy.ok() and self.executor:
                self.executor.spin_once(timeout_sec=0.1)
        except Exception as e:
            logger.error(f"Error in ROS2 spin loop: {e}")
        finally:
            logger.info("🛑 [ROS2 Manager] Spin loop stopped.")

    def stop(self):
        self._running = False
        telemetry_store.update_connection(False)

        if RCLPY_AVAILABLE:
            try:
                if self.executor:
                    self.executor.shutdown()
                if self.node:
                    self.node.destroy_node()
                if rclpy.ok():
                    rclpy.shutdown()
                logger.info("👋 [ROS2 Manager] Node 'robot_web_bridge' destroyed and rclpy shutdown cleanly.")
            except Exception as e:
                logger.error(f"Error during ROS2 shutdown: {e}")


ros_manager = ROS2Manager()
