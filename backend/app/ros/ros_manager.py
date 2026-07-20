import threading
import logging
from typing import Optional

logger = logging.getLogger("ROS2Manager")

# Optional import of rclpy for environments where ROS2 is installed
try:
    import rclpy
    from rclpy.executors import SingleThreadedExecutor
    RCLPY_AVAILABLE = True
except ImportError:
    rclpy = None
    RCLPY_AVAILABLE = False
    logger.warning("⚠️ [ROS2] rclpy module not found. Running in Fallback/Simulated Mode.")


class ROS2Manager:
    """Singleton Manager for ROS2 lifecycle and background thread execution."""

    _instance: Optional["ROS2Manager"] = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ROS2Manager, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._initialized = True
        self.node = None
        self._spin_thread: Optional[threading.Thread] = None
        self._running = False

    def start(self):
        """Initialize ROS2 context and start spin background thread."""
        if not RCLPY_AVAILABLE:
            logger.warning("[ROS2 Manager] Skipping rclpy spin - rclpy not installed.")
            return

        if self._running:
            return

        try:
            if not rclpy.ok():
                rclpy.init(args=None)
                logger.info("✅ [ROS2 Manager] rclpy initialized successfully.")

            # Deferred import of RobotBridgeNode to avoid circular dependencies
            from app.ros.ros_node import RobotBridgeNode
            self.node = RobotBridgeNode()

            self._running = True
            self._spin_thread = threading.Thread(target=self._spin_loop, daemon=True)
            self._spin_thread.start()
            logger.info("🚀 [ROS2 Manager] ROS2 Background spin thread started.")
        except Exception as e:
            logger.error(f"❌ [ROS2 Manager] Error initializing ROS2: {e}")

    def _spin_loop(self):
        """Spin ROS2 node in background thread."""
        try:
            if rclpy and self.node:
                executor = SingleThreadedExecutor()
                executor.add_node(self.node)
                while self._running and rclpy.ok():
                    executor.spin_once(timeout_sec=0.1)
        except Exception as e:
            logger.error(f"❌ [ROS2 Manager] Error in spin loop: {e}")

    def stop(self):
        """Shutdown ROS2 node and context gracefully."""
        self._running = False
        if RCLPY_AVAILABLE and rclpy.ok():
            if self.node:
                self.node.destroy_node()
            rclpy.shutdown()
            logger.info("🛑 [ROS2 Manager] ROS2 node and rclpy context shutdown gracefully.")


ros_manager = ROS2Manager()
