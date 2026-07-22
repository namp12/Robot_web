import logging
from app.ros.robot_status import telemetry_store
from app.ros.subscribers import subscribers_handler
from app.ros.camera_node import camera_handler

logger = logging.getLogger("RobotBridgeNode")

try:
    import rclpy
    from rclpy.node import Node
    from sensor_msgs.msg import BatteryState, LaserScan, Image
    from nav_msgs.msg import Odometry, OccupancyGrid
    from tf2_msgs.msg import TFMessage
    from std_msgs.msg import String
    RCLPY_AVAILABLE = True
except ImportError:
    RCLPY_AVAILABLE = False
    Node = object


class RobotBridgeNode(Node):
    """ROS2 Node named 'robot_web_bridge' subscribing to sensors and updating thread-safe RAM cache."""

    def __init__(self, node_name: str = "robot_web_bridge"):
        if not RCLPY_AVAILABLE:
            logger.warning("[RobotBridgeNode] Fallback mode: rclpy not installed.")
            return

        super().__init__(node_name)
        logger.info(f"🤖 Initializing ROS2 Node: '{node_name}'...")

        # Subscriptions to topics
        self._sub_battery = self.create_subscription(
            BatteryState, "/battery", subscribers_handler.handle_battery, 10
        )
        self._sub_scan = self.create_subscription(
            LaserScan, "/scan", subscribers_handler.handle_scan, 10
        )
        self._sub_odom = self.create_subscription(
            Odometry, "/odom", subscribers_handler.handle_odom, 10
        )
        self._sub_map = self.create_subscription(
            OccupancyGrid, "/map", subscribers_handler.handle_map, 10
        )
        self._sub_tf = self.create_subscription(
            TFMessage, "/tf", subscribers_handler.handle_tf, 10
        )
        self._sub_camera = self.create_subscription(
            Image, "/camera/image_raw", camera_handler.handle_image_msg, 10
        )
        self._sub_esp_status = self.create_subscription(
            String, "/esp/status", subscribers_handler.handle_esp_status, 10
        )

        logger.info("📡 Subscribed topics: /battery, /scan, /odom, /map, /tf, /camera/image_raw, /esp/status")

        # Initialize publishers handler with active ROS2 node
        from geometry_msgs.msg import Twist
        from app.ros.publishers import publishers_handler
        publishers_handler.node = self
        publishers_handler.cmd_vel_pub = self.create_publisher(Twist, "/cmd_vel", 10)
        publishers_handler.camera_ctrl_pub = self.create_publisher(String, "/camera/control", 10)
        publishers_handler.slam_ctrl_pub = self.create_publisher(String, "/slam/control", 10)
        publishers_handler.esp32_serial_tx_pub = self.create_publisher(String, "/esp32/serial_tx", 10)
        logger.info("📡 Initialized publishers for: /cmd_vel, /camera/control, /slam/control, /esp32/serial_tx")
