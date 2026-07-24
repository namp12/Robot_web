import logging
import time

logger = logging.getLogger("RobotSerialBridge")

try:
    import rclpy
    from rclpy.node import Node
    from std_msgs.msg import String
    from sensor_msgs.msg import BatteryState, Imu, Range
    RCLPY_AVAILABLE = True
except ImportError:
    RCLPY_AVAILABLE = False
    Node = object

try:
    import serial
    SERIAL_AVAILABLE = True
except ImportError:
    SERIAL_AVAILABLE = False


class RobotSerialNode(Node):
    """ROS2 Node that handles serial communication with ESP32.
    It relays /esp32/serial_tx to the physical serial port and listens for ESP telemetry.
    """

    def __init__(self, port: str = "/dev/ttyUSB0", baudrate: int = 115200, node_name: str = "robot_serial_bridge"):
        if not RCLPY_AVAILABLE:
            logger.warning("[RobotSerialNode] Fallback mode: rclpy not installed.")
            return

        super().__init__(node_name)
        logger.info(f"🔌 Initializing ROS2 Serial Node: '{node_name}' on port {port} at {baudrate} baud...")

        # Setup serial connection with fallback
        self.serial_port = None
        self.port = port
        self.baudrate = baudrate

        if SERIAL_AVAILABLE:
            try:
                self.serial_port = serial.Serial(port=port, baudrate=baudrate, timeout=0.1)
                logger.info(f"✅ Serial port {port} opened successfully.")
            except Exception as e:
                logger.error(f"❌ Could not open serial port {port}: {e}. Running in simulated mode.")
        else:
            logger.warning("⚠️ pyserial not installed. Running in simulated mode.")

        # Subscriptions
        self._sub_tx = self.create_subscription(
            String, "/robot/move", self.handle_serial_tx, 10
        )

        # Publishers
        self._pub_esp_status = self.create_publisher(String, "/esp/status", 10)
        self._pub_battery = self.create_publisher(BatteryState, "/sensor/battery", 10)
        self._pub_imu = self.create_publisher(Imu, "/imu/data", 10)
        self._pub_front_dist = self.create_publisher(Range, "/sensor/front_distance", 10)
        self._pub_rear_dist = self.create_publisher(Range, "/sensor/rear_distance", 10)
        self._pub_encoder = self.create_publisher(String, "/wheel/encoder", 10)

        # Timer to read from serial port (approx 50Hz)
        self.create_timer(0.02, self.read_serial_rx)
        logger.info("📡 Subscribed to: /robot/move. Publishing to: /esp/status, /sensor/battery, /wheel/encoder")

    def handle_serial_tx(self, msg: String):
        """Callback for messages to send to the ESP32."""
        cmd_text = msg.data.strip()
        logger.info(f"📤 [Serial TX] Sending command to ESP: '{cmd_text}'")
        
        # Write to serial port
        if self.serial_port and self.serial_port.is_open:
            try:
                self.serial_port.write((cmd_text + "\n").encode("utf-8"))
            except Exception as e:
                logger.error(f"Error writing to serial port: {e}")
        else:
            logger.info(f"[Serial Sim] Written to mock ESP: {cmd_text}")

    def read_serial_rx(self):
        """Timer callback to read incoming telemetry lines from ESP32."""
        if self.serial_port and self.serial_port.is_open:
            try:
                if self.serial_port.in_waiting > 0:
                    line = self.serial_port.readline().decode("utf-8").strip()
                    if line:
                        logger.info(f"📥 [Serial RX] ESP telemetry line: '{line}'")
                        self.parse_esp_line(line)
            except Exception as e:
                logger.error(f"Error reading from serial port: {e}")
        else:
            # Simulated telemetry generation
            pass

    def parse_esp_line(self, line: str):
        """Parse text line from ESP32 and publish as ROS2 messages.
        Expected formats:
        - "STATUS OK"
        - "BATTERY <percentage> <voltage> <current>"
        """
        parts = line.split()
        if not parts:
            return

        header = parts[0].upper()
        if header == "STATUS" and len(parts) >= 2:
            status_msg = String()
            status_msg.data = parts[1]
            self._pub_esp_status.publish(status_msg)
        elif header == "BATTERY" and len(parts) >= 4:
            try:
                pct = float(parts[1])
                volt = float(parts[2])
                curr = float(parts[3])

                battery_msg = BatteryState()
                battery_msg.percentage = pct
                battery_msg.voltage = volt
                battery_msg.current = curr
                self._pub_battery.publish(battery_msg)
            except (ValueError, IndexError) as e:
                logger.error(f"Failed to parse battery telemetry line '{line}': {e}")
        elif header == "RANGE" and len(parts) >= 3:
            try:
                front_val = float(parts[1])
                rear_val = float(parts[2])

                # Publish front range
                front_msg = Range()
                front_msg.header.stamp = self.get_clock().now().to_msg()
                front_msg.header.frame_id = "front_sensor"
                front_msg.radiation_type = Range.ULTRASONIC
                front_msg.field_of_view = 0.5
                front_msg.min_range = 0.02
                front_msg.max_range = 4.0
                front_msg.range = front_val
                self._pub_front_dist.publish(front_msg)

                # Publish rear range
                rear_msg = Range()
                rear_msg.header.stamp = self.get_clock().now().to_msg()
                rear_msg.header.frame_id = "rear_sensor"
                rear_msg.radiation_type = Range.ULTRASONIC
                rear_msg.field_of_view = 0.5
                rear_msg.min_range = 0.02
                rear_msg.max_range = 4.0
                rear_msg.range = rear_val
                self._pub_rear_dist.publish(rear_msg)
            except (ValueError, IndexError) as e:
                logger.error(f"Failed to parse range telemetry line '{line}': {e}")
        elif header == "IMU" and len(parts) >= 5:
            try:
                qx = float(parts[1])
                qy = float(parts[2])
                qz = float(parts[3])
                qw = float(parts[4])

                imu_msg = Imu()
                imu_msg.header.stamp = self.get_clock().now().to_msg()
                imu_msg.header.frame_id = "imu_link"
                imu_msg.orientation.x = qx
                imu_msg.orientation.y = qy
                imu_msg.orientation.z = qz
                imu_msg.orientation.w = qw
                self._pub_imu.publish(imu_msg)
            except (ValueError, IndexError) as e:
                logger.error(f"Failed to parse IMU telemetry line '{line}': {e}")
        elif header == "ENCODER" and len(parts) >= 5:
            try:
                encoder_msg = String()
                encoder_msg.data = " ".join(parts[1:5])
                self._pub_encoder.publish(encoder_msg)
            except Exception as e:
                logger.error(f"Failed to publish encoder message: {e}")


def main(args=None):
    if not RCLPY_AVAILABLE:
        print("rclpy not available.")
        return
    rclpy.init(args=args)
    node = RobotSerialNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        if node.serial_port and node.serial_port.is_open:
            node.serial_port.close()
        node.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()
