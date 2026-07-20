-- =====================================================
-- ROBOT DATABASE
-- Author : Phuong Nam
-- Database : SQLite
-- Project : Robot Thám Hiểm ROS2
-- =====================================================

PRAGMA foreign_keys = ON;

-- =====================================================
-- ROBOTS
-- =====================================================

CREATE TABLE robots(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    robot_name TEXT NOT NULL,
    serial_number TEXT UNIQUE,
    model TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- USERS
-- =====================================================

CREATE TABLE users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    fullname TEXT,
    role TEXT DEFAULT 'user',
    is_active INTEGER DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ROBOT SETTINGS
-- =====================================================

CREATE TABLE robot_settings(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    robot_id INTEGER,

    max_speed REAL DEFAULT 1.0,
    max_pwm INTEGER DEFAULT 255,

    -- ROS2 & Network Configuration
    ros_domain_id INTEGER DEFAULT 0,
    robot_ip TEXT,
    ws_port INTEGER DEFAULT 8000,

    -- LiDAR Configuration
    lidar_port TEXT,
    lidar_baudrate INTEGER,

    -- Camera Configuration
    camera_enabled INTEGER DEFAULT 1,
    camera_device TEXT DEFAULT '/dev/video0',
    camera_width INTEGER DEFAULT 1280,
    camera_height INTEGER DEFAULT 720,
    camera_fps INTEGER DEFAULT 30,

    -- AI Configuration
    ai_enabled INTEGER DEFAULT 1,
    ai_model_name TEXT DEFAULT 'yolov8n',
    ai_confidence_threshold REAL DEFAULT 0.5,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(robot_id)
    REFERENCES robots(id) ON DELETE CASCADE
);

-- =====================================================
-- MAPS
-- =====================================================

CREATE TABLE maps(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    robot_id INTEGER,

    map_name TEXT NOT NULL,
    yaml_path TEXT,
    image_path TEXT,
    description TEXT,

    -- Nav2 / SLAM Metadata
    resolution REAL DEFAULT 0.05,
    origin_x REAL DEFAULT 0.0,
    origin_y REAL DEFAULT 0.0,
    origin_yaw REAL DEFAULT 0.0,
    width INTEGER,
    height INTEGER,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(robot_id)
    REFERENCES robots(id) ON DELETE CASCADE
);

-- =====================================================
-- WAYPOINTS (Saved Goals)
-- =====================================================

CREATE TABLE waypoints(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    map_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    pos_x REAL NOT NULL,
    pos_y REAL NOT NULL,
    yaw REAL DEFAULT 0.0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(map_id)
    REFERENCES maps(id) ON DELETE CASCADE
);

-- =====================================================
-- MISSIONS
-- =====================================================

CREATE TABLE missions(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    robot_id INTEGER,
    map_id INTEGER,
    created_by INTEGER,

    mission_name TEXT,
    status TEXT,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    note TEXT,

    FOREIGN KEY(robot_id)
    REFERENCES robots(id) ON DELETE SET NULL,

    FOREIGN KEY(map_id)
    REFERENCES maps(id) ON DELETE SET NULL,

    FOREIGN KEY(created_by)
    REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- MISSION LOG
-- =====================================================

CREATE TABLE mission_logs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    event TEXT,
    detail TEXT,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id) ON DELETE CASCADE
);

-- =====================================================
-- BLACKBOX
-- =====================================================

CREATE TABLE blackbox(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    pos_x REAL,
    pos_y REAL,
    yaw REAL,

    linear_speed REAL,
    angular_speed REAL,

    battery REAL,
    cpu REAL,
    ram REAL,
    wifi_signal INTEGER,

    event TEXT,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id) ON DELETE CASCADE
);

-- =====================================================
-- BATTERY
-- =====================================================

CREATE TABLE battery_logs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    voltage REAL,
    current REAL,
    percentage INTEGER,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id) ON DELETE CASCADE
);

-- =====================================================
-- SENSOR
-- =====================================================

CREATE TABLE sensor_logs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    imu_acc_x REAL,
    imu_acc_y REAL,
    imu_acc_z REAL,

    imu_gyro_x REAL,
    imu_gyro_y REAL,
    imu_gyro_z REAL,

    temperature REAL,
    pressure REAL,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id) ON DELETE CASCADE
);

-- =====================================================
-- MOTOR
-- =====================================================

CREATE TABLE motor_logs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    left_rpm REAL,
    right_rpm REAL,

    left_pwm INTEGER,
    right_pwm INTEGER,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id) ON DELETE CASCADE
);

-- =====================================================
-- NAVIGATION
-- =====================================================

CREATE TABLE navigation_logs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    goal_x REAL,
    goal_y REAL,
    goal_yaw REAL DEFAULT 0.0,

    current_x REAL,
    current_y REAL,

    status TEXT,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id) ON DELETE CASCADE
);

-- =====================================================
-- AI
-- =====================================================

CREATE TABLE ai_logs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    model TEXT,
    question TEXT,
    answer TEXT,

    latency REAL,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id) ON DELETE CASCADE
);

-- =====================================================
-- OBJECT DETECTION
-- =====================================================

CREATE TABLE detection_logs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    object_name TEXT,
    confidence REAL,

    -- Bounding Box coordinates
    bbox_x REAL,
    bbox_y REAL,
    bbox_w REAL,
    bbox_h REAL,

    image_path TEXT,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id) ON DELETE CASCADE
);

-- =====================================================
-- IMAGES
-- =====================================================

CREATE TABLE images(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    image_path TEXT,
    description TEXT,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id) ON DELETE CASCADE
);

-- =====================================================
-- VIDEOS
-- =====================================================

CREATE TABLE videos(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    video_path TEXT,
    duration REAL,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id) ON DELETE CASCADE
);

-- =====================================================
-- ROSBAG / MCAP
-- =====================================================

CREATE TABLE rosbags(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER,

    bag_path TEXT,
    size_mb REAL,
    duration REAL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id) ON DELETE CASCADE
);

-- =====================================================
-- ERROR LOG
-- =====================================================

CREATE TABLE error_logs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    node TEXT,
    level TEXT,
    message TEXT,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id) ON DELETE CASCADE
);

-- =====================================================
-- SYSTEM LOG
-- =====================================================

CREATE TABLE system_logs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    cpu REAL,
    ram REAL,
    disk REAL,

    cpu_temperature REAL,
    gpu_temperature REAL
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Timestamp Indexes
CREATE INDEX idx_blackbox_time ON blackbox(timestamp);
CREATE INDEX idx_battery_time ON battery_logs(timestamp);
CREATE INDEX idx_sensor_time ON sensor_logs(timestamp);
CREATE INDEX idx_motor_time ON motor_logs(timestamp);
CREATE INDEX idx_navigation_time ON navigation_logs(timestamp);
CREATE INDEX idx_detection_time ON detection_logs(timestamp);
CREATE INDEX idx_ai_time ON ai_logs(timestamp);
CREATE INDEX idx_error_time ON error_logs(timestamp);
CREATE INDEX idx_system_time ON system_logs(timestamp);

-- Foreign Key / Mission Lookup Indexes
CREATE INDEX idx_blackbox_mission ON blackbox(mission_id);
CREATE INDEX idx_navigation_mission ON navigation_logs(mission_id);
CREATE INDEX idx_detection_mission ON detection_logs(mission_id);
CREATE INDEX idx_error_mission ON error_logs(mission_id);
CREATE INDEX idx_battery_mission ON battery_logs(mission_id);
CREATE INDEX idx_sensor_mission ON sensor_logs(mission_id);
CREATE INDEX idx_waypoints_map ON waypoints(map_id);

-- =====================================================
-- END
-- =====================================================
