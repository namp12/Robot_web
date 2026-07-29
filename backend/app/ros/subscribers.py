import math
import time
import logging
from app.ros.robot_status import telemetry_store

logger = logging.getLogger("ROS2Subscribers")


class TopicSubscribersHandler:
    """Subscriber callbacks for caching latest topic frames into RAM."""

    @staticmethod
    def handle_battery(msg):
        try:
            if hasattr(msg, "percentage"):
                percentage = float(msg.percentage)
                voltage = float(getattr(msg, "voltage", 24.2))
                current = float(getattr(msg, "current", 3.5))
            else:
                # msg is Float32, which is voltage (e.g. 24.2 or 12.6)
                voltage = float(msg.data)
                if voltage > 16.0:  # 24V system
                    percentage = max(0.0, min(100.0, (voltage - 21.0) / (25.2 - 21.0) * 100.0))
                else:  # 12V system
                    percentage = max(0.0, min(100.0, (voltage - 10.5) / (12.6 - 10.5) * 100.0))
                current = 0.0
            telemetry_store.update_battery(percentage, voltage, current)
        except Exception as e:
            logger.error(f"Error handling /sensor/battery: {e}")

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

    @staticmethod
    def handle_esp_status(msg):
        try:
            status_text = str(getattr(msg, "data", "OFFLINE")).upper()
            
            # If status_text is one of the valid RobotStatus values:
            if status_text in ['ONLINE', 'OFFLINE', 'EMERGENCY_STOP', 'AUTONOMOUS', 'MANUAL', 'ROS']:
                with telemetry_store._lock:
                    telemetry_store._robot_status = status_text
                    telemetry_store._last_update = time.time()
                    
            is_ok = status_text in ["OK", "CONNECTED", "ACTIVE", "ONLINE", "MANUAL", "ROS", "AUTONOMOUS"]
            from app.ros.esp_node import esp_handler
            esp_handler.handle_esp_status("OK" if is_ok else "OFFLINE")
        except Exception as e:
            logger.error(f"Error handling /esp32/status: {e}")

    @staticmethod
    def handle_esp_mode(msg):
        try:
            mode_text = str(getattr(msg, "data", "MANUAL")).upper()
            if "MANUAL" in mode_text:
                mapped_mode = "MANUAL"
            elif "AUTO" in mode_text:
                mapped_mode = "AUTO"
            elif "ROS" in mode_text:
                mapped_mode = "ROS"
            else:
                mapped_mode = mode_text
            telemetry_store.update_mode(mapped_mode)
        except Exception as e:
            logger.error(f"Error handling /esp32/mode: {e}")

    @staticmethod
    def handle_front_distance(msg):
        try:
            val = float(getattr(msg, "range", getattr(msg, "data", 0.0)))
            logger.info(f"📥 [Front Sensor] Received distance: {val}")
            telemetry_store.update_sensor_distance(front=val)
        except Exception as e:
            logger.error(f"Error handling /sensor/front_distance: {e}")

    @staticmethod
    def handle_rear_distance(msg):
        try:
            val = float(getattr(msg, "range", getattr(msg, "data", 0.0)))
            logger.info(f"📥 [Rear Sensor] Received distance: {val}")
            telemetry_store.update_sensor_distance(rear=val)
        except Exception as e:
            logger.error(f"Error handling /sensor/rear_distance: {e}")

    @staticmethod
    def handle_imu(msg):
        try:
            q = getattr(msg, "orientation", None)
            acc = getattr(msg, "linear_acceleration", None)
            gyro = getattr(msg, "angular_velocity", None)

            accel_dict = {"x": float(acc.x), "y": float(acc.y), "z": float(acc.z)} if acc else None
            gyro_dict = {"x": float(gyro.x), "y": float(gyro.y), "z": float(gyro.z)} if gyro else None

            if q:
                telemetry_store.update_imu(
                    float(q.x), float(q.y), float(q.z), float(q.w),
                    accel=accel_dict, gyro=gyro_dict
                )
                
                # Convert quaternion orientation to Euler angles (roll, pitch, yaw) in degrees
                x, y, z, w = float(q.x), float(q.y), float(q.z), float(q.w)
                
                # roll (x-axis rotation)
                sinr_cosp = 2.0 * (w * x + y * z)
                cosr_cosp = 1.0 - 2.0 * (x * x + y * y)
                roll_deg = math.degrees(math.atan2(sinr_cosp, cosr_cosp))

                # pitch (y-axis rotation)
                sinp = 2.0 * (w * y - z * x)
                if abs(sinp) >= 1.0:
                    pitch_deg = math.degrees(math.copysign(math.pi / 2.0, sinp))
                else:
                    pitch_deg = math.degrees(math.asin(sinp))

                # yaw (z-axis rotation)
                siny_cosp = 2.0 * (w * z + x * y)
                cosy_cosp = 1.0 - 2.0 * (y * y + z * z)
                yaw_deg = math.degrees(math.atan2(siny_cosp, cosy_cosp))

                telemetry_store.update_euler_angles(roll_deg, pitch_deg, yaw_deg)
        except Exception as e:
            logger.error(f"Error handling /imu/data: {e}")

    @staticmethod
    def handle_encoder(msg):
        try:
            data_str = str(getattr(msg, "data", "0 0 0 0"))
            parts = data_str.replace(",", " ").split()
            if len(parts) >= 4:
                fl = float(parts[0])
                fr = float(parts[1])
                rl = float(parts[2])
                rr = float(parts[3])
                telemetry_store.update_encoders(fl, fr, rl, rr)
        except Exception as e:
            logger.error(f"Error handling /wheel/encoder: {e}")

    @staticmethod
    def handle_encoder_distance(msg):
        try:
            val = float(msg.data)
            telemetry_store.update_encoder_distance(val)
            # Also update encoders for backward compatibility
            telemetry_store.update_encoders(val, val, val, val)
        except Exception as e:
            logger.error(f"Error handling /esp32/encoder_distance: {e}")

    @staticmethod
    def handle_ai_detection(msg):
        try:
            import json
            from app.database.nosql import nosql_db
            data_str = str(getattr(msg, "data", "[]"))
            detections = json.loads(data_str)
            telemetry_store.update_ai_detections(detections)
            
            # Save detections persistently to TinyDB NoSQL database
            if detections:
                nosql_db.insert_detection(mission_id=1, detections=detections)
        except Exception as e:
            logger.error(f"Error handling /ai/detection: {e}")


subscribers_handler = TopicSubscribersHandler()
