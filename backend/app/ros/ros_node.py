import logging
from app.ros.robot_status import telemetry_store

logger = logging.getLogger("RobotBridgeNode")

try:
    import rclpy
    from rclpy.node import Node
    from geometry_msgs.msg import Twist
    from std_msgs.msg import String, Float32, Bool
    RCLPY_AVAILABLE = True
except ImportError:
    Node = object
    RCLPY_AVAILABLE = False


class RobotBridgeNode(Node if RCLPY_AVAILABLE else object):
    """Main ROS2 Bridge Node for Robot Explorer Platform."""

    def __init__(self):
        if not RCLPY_AVAILABLE:
            logger.warning("Mock RobotBridgeNode initialized (rclpy unavailable).")
            return

        super().__init__("robot_explorer_web_bridge")
        logger.info("🤖 [RobotBridgeNode] Initializing subscribers and publishers...")

        # ----------------------------------------------------
        # PUBLISHERS
        # ----------------------------------------------------
        self.cmd_vel_pub = self.create_publisher(Twist, "/cmd_vel", 10)
        self.camera_ctrl_pub = self.create_publisher(String, "/camera/control", 10)
        self.slam_ctrl_pub = self.create_publisher(String, "/slam/control", 10)
        self.nav_cancel_pub = self.create_publisher(Bool, "/navigation/cancel", 10)
        self.sys_reboot_pub = self.create_publisher(String, "/system/reboot", 10)

        # ----------------------------------------------------
        # SUBSCRIBERS
        # ----------------------------------------------------
        self.create_subscription(Float32, "/battery", self._battery_callback, 10)
        self.create_subscription(String, "/navigation/status", self._nav_status_callback, 10)
        self.create_subscription(String, "/esp/status", self._esp_status_callback, 10)
        self.create_subscription(String, "/camera/status", self._camera_status_callback, 10)

        # Heartbeat timer updating state store
        self.create_timer(1.0, self._heartbeat_callback)
        telemetry_store.update_connection(True)

    def _heartbeat_callback(self):
        telemetry_store.update_connection(True)
        telemetry_store.update_subsystems(camera=True, lidar=True, esp32=True)

    def _battery_callback(self, msg):
        try:
            val = float(msg.data)
            telemetry_store.update_battery(val)
        except Exception as e:
            logger.error(f"Error reading battery msg: {e}")

    def _nav_status_callback(self, msg):
        telemetry_store.update_navigation(msg.data)

    def _esp_status_callback(self, msg):
        is_ok = msg.data.upper() == "OK"
        telemetry_store.update_subsystems(esp32=is_ok)

    def _camera_status_callback(self, msg):
        is_ok = msg.data.upper() == "ACTIVE"
        telemetry_store.update_subsystems(camera=is_ok)

    # ----------------------------------------------------
    # PUBLIC METHOD INTERFACES FOR SERVICES & ROUTERS
    # ----------------------------------------------------
    def publish_cmd_vel(self, linear_x: float, angular_z: float):
        """Publish velocity command to /cmd_vel."""
        if not RCLPY_AVAILABLE or not hasattr(self, "cmd_vel_pub"):
            telemetry_store.update_pose(x=2.45, y=-1.12, yaw=45.0, linear=linear_x, angular=angular_z)
            return

        msg = Twist()
        msg.linear.x = float(linear_x)
        msg.angular.z = float(angular_z)
        self.cmd_vel_pub.publish(msg)
        logger.info(f"Published /cmd_vel: linear={linear_x}, angular={angular_z}")

    def emergency_stop(self):
        """Publish zero velocity immediately to /cmd_vel."""
        self.publish_cmd_vel(0.0, 0.0)
        telemetry_store.set_emergency_stop()
        logger.warning("🚨 [RobotBridgeNode] EMERGENCY STOP PUBLISHED to /cmd_vel!")

    def publish_camera_control(self, command: str):
        if not RCLPY_AVAILABLE or not hasattr(self, "camera_ctrl_pub"):
            return
        msg = String()
        msg.data = command
        self.camera_ctrl_pub.publish(msg)

    def publish_slam_control(self, command: str):
        if not RCLPY_AVAILABLE or not hasattr(self, "slam_ctrl_pub"):
            return
        msg = String()
        msg.data = command
        self.slam_ctrl_pub.publish(msg)
