import logging

logger = logging.getLogger("ROS2Publishers")

try:
    from geometry_msgs.msg import Twist
    from std_msgs.msg import String, Bool
    RCLPY_AVAILABLE = True
except ImportError:
    RCLPY_AVAILABLE = False


class TopicPublishersHandler:
    """Handler for ROS2 Publishers (/cmd_vel, /camera/control, /slam/control, /robot/move, /robot/mode_cmd)."""

    def __init__(self, node=None):
        self.node = node
        self.cmd_vel_pub = None
        self.camera_ctrl_pub = None
        self.slam_ctrl_pub = None
        self.esp32_serial_tx_pub = None
        self.mode_cmd_pub = None

        if RCLPY_AVAILABLE and self.node:
            self.cmd_vel_pub = self.node.create_publisher(Twist, "/cmd_vel", 10)
            self.camera_ctrl_pub = self.node.create_publisher(String, "/camera/control", 10)
            self.slam_ctrl_pub = self.node.create_publisher(String, "/slam/control", 10)
            self.esp32_serial_tx_pub = self.node.create_publisher(String, "/robot/move", 10)
            self.mode_cmd_pub = self.node.create_publisher(String, "/robot/mode_cmd", 10)

    def publish_robot_move(self, text: str):
        if not RCLPY_AVAILABLE or not self.esp32_serial_tx_pub:
            logger.info(f"[Publishers Fallback] /robot/move: '{text}'")
            return
        msg = String()
        msg.data = text
        self.esp32_serial_tx_pub.publish(msg)

    def publish_mode_cmd(self, mode: str):
        if not RCLPY_AVAILABLE or not self.mode_cmd_pub:
            logger.info(f"[Publishers Fallback] /robot/mode_cmd: '{mode}'")
            return
        msg = String()
        msg.data = mode
        self.mode_cmd_pub.publish(msg)

    def publish_cmd_vel(self, linear_x: float, linear_y: float, angular_z: float):
        if not RCLPY_AVAILABLE or not self.cmd_vel_pub:
            logger.info(f"[Publishers Fallback] CmdVel: linear_x={linear_x}, linear_y={linear_y}, angular_z={angular_z}")
            return
        msg = Twist()
        msg.linear.x = float(linear_x)
        msg.linear.y = float(linear_y)
        msg.angular.z = float(angular_z)
        self.cmd_vel_pub.publish(msg)

    def emergency_stop(self):
        self.publish_cmd_vel(0.0, 0.0, 0.0)
        logger.warning("🚨 [Publishers] Emergency stop /cmd_vel=0 published!")


publishers_handler = TopicPublishersHandler()
