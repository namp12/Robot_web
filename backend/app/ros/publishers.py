import logging

logger = logging.getLogger("ROS2Publishers")

try:
    from geometry_msgs.msg import Twist
    from std_msgs.msg import String, Bool
    RCLPY_AVAILABLE = True
except ImportError:
    RCLPY_AVAILABLE = False


class TopicPublishersHandler:
    """Handler for ROS2 Publishers (/cmd_vel, /camera/control, /slam/control)."""

    def __init__(self, node=None):
        self.node = node
        self.cmd_vel_pub = None
        self.camera_ctrl_pub = None
        self.slam_ctrl_pub = None

        if RCLPY_AVAILABLE and self.node:
            self.cmd_vel_pub = self.node.create_publisher(Twist, "/cmd_vel", 10)
            self.camera_ctrl_pub = self.node.create_publisher(String, "/camera/control", 10)
            self.slam_ctrl_pub = self.node.create_publisher(String, "/slam/control", 10)

    def publish_cmd_vel(self, linear_x: float, angular_z: float):
        if not RCLPY_AVAILABLE or not self.cmd_vel_pub:
            logger.info(f"[Publishers Fallback] CmdVel: linear={linear_x}, angular={angular_z}")
            return
        msg = Twist()
        msg.linear.x = float(linear_x)
        msg.angular.z = float(angular_z)
        self.cmd_vel_pub.publish(msg)

    def emergency_stop(self):
        self.publish_cmd_vel(0.0, 0.0)
        logger.warning("🚨 [Publishers] Emergency stop /cmd_vel=0 published!")


publishers_handler = TopicPublishersHandler()
