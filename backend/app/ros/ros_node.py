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
            BatteryState, "/sensor/battery", subscribers_handler.handle_battery, 10
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
        self._sub_encoder = self.create_subscription(
            String, "/wheel/encoder", subscribers_handler.handle_encoder, 10
        )
        self._sub_ai_detection = self.create_subscription(
            String, "/ai/detection", subscribers_handler.handle_ai_detection, 10
        )

        # Subscribe to IMU (MPU)
        try:
            from sensor_msgs.msg import Imu
            self._sub_imu = self.create_subscription(
                Imu, "/imu/data", subscribers_handler.handle_imu, 10
            )
            logger.info("📡 Subscribed to IMU: /imu/data")
        except Exception as e:
            logger.error(f"Error subscribing to IMU: {e}")

        # Subscribe to Front/Rear Distance Sensors (dynamic type resolution with 1s delay)
        self._distances_resolved = False
        self._resolve_attempts = 0
        self._resolve_timer = self.create_timer(1.0, self._resolve_distance_sensors)

        logger.info("📡 Subscribed topics: /battery, /scan, /odom, /map, /tf, /camera/image_raw, /esp/status, /imu/data")

        # Initialize publishers handler with active ROS2 node
        from geometry_msgs.msg import Twist
        from app.ros.publishers import publishers_handler
        publishers_handler.node = self
        publishers_handler.cmd_vel_pub = self.create_publisher(Twist, "/cmd_vel", 10)
        publishers_handler.camera_ctrl_pub = self.create_publisher(String, "/camera/control", 10)
        publishers_handler.slam_ctrl_pub = self.create_publisher(String, "/slam/control", 10)
        publishers_handler.esp32_serial_tx_pub = self.create_publisher(String, "/robot/move", 10)
        publishers_handler.mode_cmd_pub = self.create_publisher(String, "/robot/mode_cmd", 10)
        logger.info("📡 Initialized publishers for: /cmd_vel, /camera/control, /slam/control, /robot/move, /robot/mode_cmd")

    def _resolve_distance_sensors(self):
        if self._distances_resolved:
            return

        front_type = None
        rear_type = None
        try:
            for name, types in self.get_topic_names_and_types():
                if name == "/sensor/front_distance" and types:
                    front_type = types[0]
                elif name == "/sensor/rear_distance" and types:
                    rear_type = types[0]
        except Exception as e:
            logger.error(f"Error querying topic types: {e}")
            return

        logger.info(f"🔍 [Range Resolver] Attempt {self._resolve_attempts + 1}: Found front_type={front_type}, rear_type={rear_type}")
        self._resolve_attempts += 1

        # If both types are resolved, or after 5 attempts, we create subscriptions
        if (front_type and rear_type) or self._resolve_attempts >= 5:
            self._distances_resolved = True
            
            # Default fallback types
            if not front_type:
                front_type = "sensor_msgs/msg/Range"
            if not rear_type:
                rear_type = "sensor_msgs/msg/Range"

            def resolve_msg_class(type_str: str):
                if "Range" in type_str:
                    from sensor_msgs.msg import Range
                    return Range
                else:
                    from std_msgs.msg import Float32
                    return Float32

            FrontClass = resolve_msg_class(front_type)
            RearClass = resolve_msg_class(rear_type)

            try:
                self._sub_front_dist = self.create_subscription(
                    FrontClass, "/sensor/front_distance", subscribers_handler.handle_front_distance, 10
                )
                self._sub_rear_dist = self.create_subscription(
                    RearClass, "/sensor/rear_distance", subscribers_handler.handle_rear_distance, 10
                )
                logger.info(f"📡 Dynamically subscribed to: front={FrontClass.__name__} ({front_type}), rear={RearClass.__name__} ({rear_type})")
            except Exception as e:
                logger.error(f"Error creating distance subscriptions: {e}")

            # Destroy the resolver timer
            self.destroy_timer(self._resolve_timer)
