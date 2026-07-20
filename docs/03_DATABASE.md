# 03 - Database Specification

Cơ sở dữ liệu sử dụng **SQLite** quản lý qua **Async SQLAlchemy 2.x ORM**.

### Các Bảng Chính:
- `robots`: Thông tin thiết bị robot.
- `users`: Quản lý người dùng & phân quyền operator.
- `robot_settings`: Cấu hình thông số Robot, ROS Domain ID, Mạng, Camera và AI.
- `maps` & `waypoints`: Bản đồ SLAM và danh sách trạm dừng/điểm điều hướng lưu trữ.
- `missions` & `mission_logs`: Nhiệm vụ điều hướng và tiến trình thực hiện.
- `blackbox`: Nhật ký vận chuyển thời gian thực (Position, Battery, Speed, CPU, Event).
- `system_logs`: Nhật ký tài nguyên phần cứng.
