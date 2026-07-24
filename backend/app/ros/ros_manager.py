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
            self._running = True
            self._thread = threading.Thread(target=self._sim_loop, daemon=True)
            self._thread.start()
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

    def _sim_loop(self):
        logger.info("🔄 [ROS2 Manager] Fallback simulation loop active...")
        import random
        import time
        while self._running:
            # Refresh connection timestamp to stay ONLINE
            telemetry_store.update_connection(True)
            
            # Fetch snapshot to modify fields
            snap = telemetry_store.get_snapshot()
            current_batt = snap.get("battery", 88.0)
            next_batt = max(5.0, current_batt - 0.01) if current_batt > 5.0 else 99.0

            # Generate random numbers for telemetry
            cpu = random.uniform(25.0, 45.0)
            ram = random.uniform(50.0, 55.0)
            temp = random.uniform(45.0, 50.0)
            wifi = random.randint(85, 95)

            telemetry_store.update_battery(next_batt, 24.2, 3.5)
            telemetry_store.update_system(cpu, ram, temp, wifi)
            
            # Generate mock encoder values (in ticks/second)
            telemetry_store.update_encoders(
                random.uniform(10.0, 15.0),
                random.uniform(10.0, 15.0),
                random.uniform(10.0, 15.0),
                random.uniform(10.0, 15.0)
            )

            # Generate mock raw IMU data
            accel = {"x": random.uniform(-0.1, 0.1), "y": random.uniform(-0.1, 0.1), "z": 9.81 + random.uniform(-0.05, 0.05)}
            gyro = {"x": random.uniform(-0.02, 0.02), "y": random.uniform(-0.02, 0.02), "z": random.uniform(-0.02, 0.02)}
            telemetry_store.update_imu(0.0, 0.0, 0.0, 1.0, accel=accel, gyro=gyro)

            # Generate mock distance sensors (in meters)
            telemetry_store.update_sensor_distance(
                front=random.uniform(0.5, 3.0),
                rear=random.uniform(0.5, 3.0)
            )

            # Generate mock AI detections
            detections = [
                {
                    "class_name": "person",
                    "score": random.uniform(0.80, 0.95),
                    "bbox": [0.15, 0.35, 0.85, 0.65]
                }
            ]
            telemetry_store.update_ai_detections(detections)

            time.sleep(1.0)

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
