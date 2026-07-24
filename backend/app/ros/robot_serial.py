import logging
import time

logger = logging.getLogger("RobotSerialBridge")

try:
    import rclpy
    from rclpy.node import Node
    from std_msgs.msg import String
    from sensor_msgs.msg import BatteryState
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
            String, "/esp32/serial_tx", self.handle_serial_tx, 10
        )

        # Publishers
        self._pub_esp_status = self.create_publisher(String, "/esp/status", 10)
        self._pub_battery = self.create_publisher(BatteryState, "/battery", 10)

        # Timer to read from serial port (approx 50Hz)
        self.create_timer(0.02, self.read_serial_rx)
        logger.info("📡 Subscribed to: /esp32/serial_tx. Publishing to: /esp/status, /battery")

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
