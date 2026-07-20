import math
import logging
from app.ros.robot_status import telemetry_store

logger = logging.getLogger("ROS2Subscribers")


class TopicSubscribersHandler:
    """Subscriber callbacks for caching latest topic frames into RAM."""

    @staticmethod
    def handle_battery(msg):
        try:
            percentage = float(getattr(msg, "percentage", 88.0))
            voltage = float(getattr(msg, "voltage", 24.2))
            current = float(getattr(msg, "current", 3.5))
            telemetry_store.update_battery(percentage, voltage, current)
        except Exception as e:
            logger.error(f"Error handling /battery: {e}")

    @staticmethod
    def handle_scan(msg):
        try:
            raw_ranges = getattr(msg, "ranges", [])
            # Filter out Inf / NaN values per ROS2 LaserScan convention
            clean_ranges = []
            for r in raw_ranges:
                val = float(r)
                if math.isnan(val) or math.isinf(val):
                    clean_ranges.append(0.0)
                else:
                    clean_ranges.append(val)

            scan_data = {
                "angle_min": float(getattr(msg, "angle_min", -3.14159)),
                "angle_max": float(getattr(msg, "angle_max", 3.14159)),
                "angle_increment": float(getattr(msg, "angle_increment", 0.0174533)),
                "ranges": clean_ranges,
            }
            telemetry_store.update_scan(scan_data)
        except Exception as e:
            logger.error(f"Error handling /scan: {e}")

    @staticmethod
    def handle_odom(msg):
        try:
            pose = msg.pose.pose
            x = float(pose.position.x)
            y = float(pose.position.y)
            z_orient = float(pose.orientation.z)
            w_orient = float(pose.orientation.w)

            # Convert quaternion to yaw angle
            siny_cosp = 2 * (w_orient * z_orient)
            cosy_cosp = 1 - 2 * (z_orient * z_orient)
            yaw_deg = round(math.degrees(math.atan2(siny_cosp, cosy_cosp)), 1)

            twist = msg.twist.twist
            linear_v = float(twist.linear.x)
            angular_v = float(twist.angular.z)

            telemetry_store.update_pose(x=x, y=y, yaw=yaw_deg, linear=linear_v, angular=angular_v)
            telemetry_store.update_odom({
                "position": {"x": x, "y": y},
                "yaw": yaw_deg,
                "velocity": {"linear": linear_v, "angular": angular_v}
            })
        except Exception as e:
            logger.error(f"Error handling /odom: {e}")

    @staticmethod
    def handle_map(msg):
        try:
            info = msg.info
            map_data = {
                "resolution": float(info.resolution),
                "width": int(info.width),
                "height": int(info.height),
                "origin": {
                    "x": float(info.origin.position.x),
                    "y": float(info.origin.position.y),
                }
            }
            telemetry_store.update_map_metadata(map_data)
        except Exception as e:
            logger.error(f"Error handling /map: {e}")

    @staticmethod
    def handle_tf(msg):
        try:
            transforms = []
            for tf_item in getattr(msg, "transforms", []):
                transforms.append({
                    "frame_id": tf_item.header.frame_id,
                    "child_frame_id": tf_item.child_frame_id,
                    "tx": float(tf_item.transform.translation.x),
                    "ty": float(tf_item.transform.translation.y),
                })
            telemetry_store.update_tf(transforms)
        except Exception as e:
            logger.error(f"Error handling /tf: {e}")


subscribers_handler = TopicSubscribersHandler()
