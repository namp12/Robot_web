# 01 - Project Overview

## 🤖 Robot Explorer Platform
Robot Explorer Platform là hệ thống giám sát và điều khiển Robot thám hiểm dựa trên **ROS2 Humble**, **FastAPI** và **React + TypeScript**.

### Mục tiêu Cốt lõi
- **Điều khiển từ xa:** Điều khiển Robot qua Joystick / WASD, đổi mode Manual/Auto, dừng khẩn cấp E-STOP.
- **Giám sát thời gian thực:** Đồng bộ trạng thái Pin, CPU, RAM, Nhiệt độ, WiFi signal, Camera, LiDAR và ESP32 qua WebSocket.
- **Điều hướng & SLAM:** Quản lý bản đồ 2D Occupancy Grid, gửi điểm đích Nav2 (NavigateToPose) và lập bản đồ SLAM.
- **Trợ lý AI Copilot:** Tương tác ngôn ngữ tự nhiên, phân tích nhật ký Hộp đen (Black Box) và nhận diện vật thể YOLO.
