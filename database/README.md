# 🗄️ Robot Database Setup

## 📋 Mô tả

Thư mục này chứa các file cấu hình và khởi tạo database SQLite cho dự án Robot Thám Hiểm ROS2.

## 📁 Cấu trúc

```
database/
├── robot_database.sql    # SQL schema định nghĩa tất cả các bảng
├── init_db.py            # Script Python khởi tạo database
├── README.md             # File hướng dẫn này
└── robot.db              # Database file (được tạo sau khi chạy init_db.py)
```

## 🚀 Cách sử dụng

### Cách 1: Dùng Script Python (Khuyến nghị)

```bash
# Đi vào thư mục database
cd database

# Chạy script khởi tạo database
python init_db.py
```

**Output:**
```
==================================================
🤖 Robot Database Initialization
==================================================
📝 Creating database at .../robot.db...
🔧 Executing SQL schema...
✅ Database initialized successfully!
📊 Tables created: 22
📈 Indexes created: 8

==================================================
📋 Database Tables (22):
  - ai_logs
  - battery_logs
  - blackbox
  - detection_logs
  - error_logs
  - images
  - mission_logs
  - missions
  - motor_logs
  - navigation_logs
  - robot_settings
  - robots
  - rosbags
  - sensor_logs
  - system_logs
  - users
  - videos
  ...
```

### Cách 2: Dùng SQLite Command Line

```bash
# Khởi tạo database từ SQL file
sqlite3 robot.db < robot_database.sql

# Hoặc khởi tạo và kiểm tra
sqlite3 robot.db ".read robot_database.sql"
```

### Cách 3: Dùng Python Thủ Công

```python
import sqlite3

# Kết nối tới database
conn = sqlite3.connect('database/robot.db')
cursor = conn.cursor()

# Đọc file SQL
with open('database/robot_database.sql', 'r') as f:
    sql_script = f.read()

# Thực thi
cursor.executescript(sql_script)
conn.commit()
conn.close()

print("✅ Database initialized!")
```

## 📊 Cấu trúc Database

### Bảng Chính

| Bảng | Mô tả |
|------|-------|
| `robots` | Thông tin robot |
| `users` | Tài khoản người dùng |
| `robot_settings` | Cấu hình robot |
| `maps` | Bản đồ SLAM |
| `missions` | Các nhiệm vụ |

### Bảng Ghi Nhận Dữ Liệu

| Bảng | Mô tả |
|------|-------|
| `blackbox` | Toàn bộ dữ liệu hoạt động robot |
| `battery_logs` | Nhật ký pin |
| `sensor_logs` | Dữ liệu cảm biến (IMU, nhiệt độ) |
| `motor_logs` | Dữ liệu động cơ (RPM, PWM) |
| `navigation_logs` | Dữ liệu навigation |
| `ai_logs` | Dữ liệu AI Assistant |
| `detection_logs` | Dữ liệu phát hiện vật thể |
| `error_logs` | Lỗi hệ thống |
| `system_logs` | Dữ liệu hệ thống |

### Bảng Phương Tiện

| Bảng | Mô tả |
|------|-------|
| `images` | Ảnh chụp |
| `videos` | Video ghi |
| `rosbags` | ROS2 bag files |

## 🔗 Quan Hệ Bảng

```
robots (1) ──→ (∞) robot_settings
robots (1) ──→ (∞) maps
robots (1) ──→ (∞) missions
                  ↓
            mission_logs
            blackbox
            battery_logs
            sensor_logs
            motor_logs
            navigation_logs
            ai_logs
            detection_logs
            images
            videos
            rosbags
            error_logs
```

## 🔑 Khóa Chính & Tham Chiếu

- Tất cả bảng sử dụng `id` làm khóa chính tự tăng
- Foreign Key được bật (`PRAGMA foreign_keys = ON`)
- Các mối quan hệ được xác định rõ ràng

## 📈 Indexes

Các index được tạo để tối ưu hóa truy vấn theo thời gian:

```sql
idx_blackbox_time         -- Tối ưu truy vấn blackbox
idx_battery_time          -- Tối ưu truy vấn pin
idx_sensor_time           -- Tối ưu truy vấn cảm biến
idx_motor_time            -- Tối ưu truy vấn động cơ
idx_navigation_time       -- Tối ưu truy vấn navigation
idx_detection_time        -- Tối ưu truy vấn phát hiện
idx_ai_time               -- Tối ưu truy vấn AI
idx_error_time            -- Tối ưu truy vấn lỗi
```

## 💡 Ghi Chú

- Database sử dụng **SQLite** - nhẹ, không cần server
- Tất cả timestamp sử dụng định dạng ISO 8601
- Foreign keys được bật để bảo vệ tính toàn vẹn dữ liệu
- Mỗi bảng có `created_at` hoặc `timestamp` để theo dõi

## 🛠️ Quản Lý Database

### Backup Database

```bash
cp robot.db robot.db.backup
```

### Reset Database

```bash
# Xóa file cũ
rm robot.db

# Khởi tạo lại
python init_db.py
```

### Kiểm Tra Cấu Trúc

```bash
sqlite3 robot.db ".schema"
```

### Kiểm Tra Dữ Liệu

```bash
sqlite3 robot.db "SELECT * FROM robots;"
```

## 📝 Lưu Ý

- Đảm bảo Python 3.7+ được cài đặt
- Cần quyền ghi vào thư mục `database/`
- SQLite sẽ tự động tạo file `robot.db` nếu chưa tồn tại

---

**Author:** Phuong Nam  
**Project:** Robot Thám Hiểm ROS2  
**Database:** SQLite
