# 07 - ROS2 Specification

- **ROS2 Distribution:** ROS2 Humble Hawksbill.
- **Topics Subscribed:** `/battery`, `/scan`, `/odom`, `/map`, `/tf`, `/navigation/status`, `/camera/status`, `/esp/status`.
- **Topics Published:** `/cmd_vel`, `/navigation/cancel`, `/camera/control`, `/slam/control`, `/system/reboot`.
- **Action Clients:** `nav2_msgs/action/NavigateToPose`.
- **Execution Mode:** `rclpy` SingleThreadedExecutor spinning in dedicated Python daemon thread.
