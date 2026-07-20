# 🤖 Robot Explorer Web

Robot Explorer Web là giao diện điều khiển và giám sát Robot Thám Hiểm được xây dựng bằng **React + TypeScript** và **FastAPI**.

Website đóng vai trò là trung tâm điều khiển robot, cho phép người dùng giám sát trạng thái, điều khiển robot, quản lý bản đồ, theo dõi camera, AI và dữ liệu hệ thống theo thời gian thực.

---

# Mục tiêu dự án

- Điều khiển Robot từ Web
- Theo dõi trạng thái Robot theo thời gian thực
- Quản lý Camera
- Quản lý LiDAR
- Điều khiển Navigation
- Quản lý bản đồ SLAM
- Giao tiếp với AI
- Ghi nhận Black Box
- Quản lý Database
- Dễ mở rộng thêm các module trong tương lai

---

# Công nghệ sử dụng

## Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Axios
- WebSocket

## Backend

- Python
- FastAPI
- SQLite
- OpenCV
- WebSocket

## Robot

- ROS2 Humble
- Raspberry Pi 4
- ESP32

---

# Kiến trúc hệ thống

```
                    React Web

                         │

            REST API + WebSocket

                         │

                    FastAPI

                         │

                      ROS2

       ┌─────────────┼─────────────┐

     Camera       Navigation      LiDAR

                         │

                      ESP32
```

---

# Repository Structure

```
Robot_Web/

│

├── frontend/

├── backend/

├── database/

├── docs/

├── README.md

└── .gitignore
```

---

# Chức năng Website

## Dashboard

Hiển thị toàn bộ trạng thái Robot.

Bao gồm:

- Robot Status
- Battery
- CPU
- RAM
- Temperature
- Camera Status
- LiDAR Status
- ESP32 Status
- Navigation Status
- Current Mission

---

## Robot Control

Cho phép điều khiển Robot.

Bao gồm:

- Joystick
- WASD
- Emergency Stop
- Speed Control
- Manual Mode
- Auto Mode

---

## Camera

Hiển thị Camera thời gian thực.

Bao gồm:

- Live Stream
- Capture Image
- Record Video
- AI Detection

---

## LiDAR

Hiển thị dữ liệu LiDAR.

Bao gồm:

- Laser Scan
- Scan Status
- Device Status

---

## SLAM

Quản lý quá trình tạo bản đồ.

Bao gồm:

- Start SLAM
- Stop SLAM
- Save Map
- Load Map
- Delete Map

---

## Navigation

Điều hướng Robot.

Bao gồm:

- Send Goal
- Cancel Goal
- Pause
- Resume
- Current Pose
- Goal Status

---

## Maps

Quản lý bản đồ.

Bao gồm:

- Create Map
- Rename Map
- Delete Map
- Import Map
- Export Map

---

## AI Assistant

Giao tiếp với Robot.

Bao gồm:

- Chat
- AI Status
- Conversation History
- AI Model

---

## Black Box

Ghi nhận toàn bộ hoạt động Robot.

Bao gồm:

- Timeline
- Battery Log
- Sensor Log
- Navigation Log
- AI Log
- Error Log

---

## System Monitor

Theo dõi tài nguyên Robot.

Bao gồm:

- CPU
- RAM
- Disk
- Temperature
- ROS2 Nodes
- ESP32 Status

---

## Settings

Quản lý cấu hình hệ thống.

Bao gồm:

- Robot
- Camera
- LiDAR
- AI
- Network
- Database

---

# Giao tiếp hệ thống

## REST API

Dùng cho các yêu cầu điều khiển.

Ví dụ:

- Robot Control
- Navigation
- Camera Control
- AI Chat
- Settings

---

## WebSocket

Dùng cho dữ liệu thời gian thực.

Bao gồm:

- Robot Status
- Battery
- Camera Status
- LiDAR Status
- Navigation Status
- ESP32 Status
- System Monitor

---

# Database

Sử dụng SQLite.

Các bảng chính:

- users
- robots
- robot_settings
- missions
- mission_logs
- blackbox
- battery_logs
- sensor_logs
- navigation_logs
- maps
- images
- videos
- ai_logs
- error_logs
- system_logs

---

# Tài liệu

Chi tiết dự án được lưu trong thư mục **docs/**.

```
docs/

01_PROJECT_OVERVIEW.md

02_SYSTEM_ARCHITECTURE.md

03_DATABASE.md

04_BACKEND_SPEC.md

05_FRONTEND_SPEC.md

06_ROS2_SPEC.md

07_AI_SPEC.md

08_HARDWARE_SPEC.md

09_CODING_RULES.md

10_DEVELOPMENT_ROADMAP.md
```

---

# Roadmap

## Phase 1

- Dashboard
- Robot Control
- Camera
- REST API
- WebSocket

## Phase 2

- LiDAR
- SLAM
- Navigation
- Maps

## Phase 3

- AI Assistant
- Black Box
- System Monitor

## Phase 4

- Multi Robot Support
- OTA Update
- Cloud Synchronization

---

# Nguyên tắc phát triển

- Frontend chỉ chịu trách nhiệm hiển thị giao diện.
- Backend xử lý toàn bộ nghiệp vụ.
- Frontend không giao tiếp trực tiếp với ROS2.
- Mọi giao tiếp với Robot đều thông qua FastAPI.
- Dữ liệu thời gian thực sử dụng WebSocket.
- Điều khiển Robot sử dụng REST API.
- Database sử dụng SQLite.
- Code theo hướng module để dễ mở rộng.

---

# Tác giả

**Phuong Nam**

Robot Explorer Platform

ROS2 • React • FastAPI • SQLite • ESP32 • Raspberry Pi