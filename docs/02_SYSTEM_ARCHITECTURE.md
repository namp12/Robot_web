# 02 - System Architecture

```
                       React Web Frontend (TypeScript + Vite)
                                          │
                         REST API (v1)  │  WebSocket (/ws/status)
                                          ▼
                         FastAPI Backend (Python 3.12 + Async)
                                          │
                      ROS2 Bridge Service (RobotTelemetryStore)
                                          ▼
                      ROS2 Humble Nodes (rclpy Background Spin)
                                          │
                      Topics / Services / Nav2 Action Clients
                                          ▼
                       Raspberry Pi 4 / ESP32 Robot Hardware
```

### Nguyên tắc Kiến trúc
1. **Duy nhất cầu nối:** Frontend KHÔNG giao tiếp trực tiếp với ROS2. Mọi luồng dữ liệu đều đi qua FastAPI.
2. **Event Loop không bị Block:** ROS2 spin chạy trên 1 Daemon Thread riêng biệt, FastAPI chạy Async.
3. **Thread-Safe Telemetry Store:** Dữ liệu cảm biến ROS2 được lưu trữ trong `RobotTelemetryStore` bảo vệ bởi `threading.Lock`.
