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
    password TEXT NOT NULL,
    fullname TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ROBOT SETTINGS
-- =====================================================

CREATE TABLE robot_settings(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    robot_id INTEGER,

    max_speed REAL,
    max_pwm INTEGER,

    lidar_port TEXT,
    lidar_baudrate INTEGER,

    camera_enabled INTEGER DEFAULT 1,
    ai_enabled INTEGER DEFAULT 1,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(robot_id)
    REFERENCES robots(id)
);

-- =====================================================
-- MAPS
-- =====================================================

CREATE TABLE maps(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    robot_id INTEGER,

    map_name TEXT,

    yaml_path TEXT,

    image_path TEXT,

    description TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(robot_id)
    REFERENCES robots(id)

);

-- =====================================================
-- MISSIONS
-- =====================================================

CREATE TABLE missions(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    robot_id INTEGER,

    map_id INTEGER,

    mission_name TEXT,

    status TEXT,

    start_time DATETIME,

    end_time DATETIME,

    note TEXT,

    FOREIGN KEY(robot_id)
    REFERENCES robots(id),

    FOREIGN KEY(map_id)
    REFERENCES maps(id)

);

-- =====================================================
-- MISSION LOG
-- =====================================================

CREATE TABLE mission_logs(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    mission_id INTEGER,

    timestamp DATETIME,

    event TEXT,

    detail TEXT,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id)

);

-- =====================================================
-- BLACKBOX
-- =====================================================

CREATE TABLE blackbox(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    mission_id INTEGER,

    timestamp DATETIME,

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
    REFERENCES missions(id)

);

-- =====================================================
-- BATTERY
-- =====================================================

CREATE TABLE battery_logs(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    mission_id INTEGER,

    timestamp DATETIME,

    voltage REAL,

    current REAL,

    percentage INTEGER,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id)

);

-- =====================================================
-- SENSOR
-- =====================================================

CREATE TABLE sensor_logs(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    mission_id INTEGER,

    timestamp DATETIME,

    imu_acc_x REAL,

    imu_acc_y REAL,

    imu_acc_z REAL,

    imu_gyro_x REAL,

    imu_gyro_y REAL,

    imu_gyro_z REAL,

    temperature REAL,

    pressure REAL,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id)

);

-- =====================================================
-- MOTOR
-- =====================================================

CREATE TABLE motor_logs(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    mission_id INTEGER,

    timestamp DATETIME,

    left_rpm REAL,

    right_rpm REAL,

    left_pwm INTEGER,

    right_pwm INTEGER,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id)

);

-- =====================================================
-- NAVIGATION
-- =====================================================

CREATE TABLE navigation_logs(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    mission_id INTEGER,

    timestamp DATETIME,

    goal_x REAL,

    goal_y REAL,

    current_x REAL,

    current_y REAL,

    status TEXT,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id)

);

-- =====================================================
-- AI
-- =====================================================

CREATE TABLE ai_logs(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    mission_id INTEGER,

    timestamp DATETIME,

    model TEXT,

    question TEXT,

    answer TEXT,

    latency REAL,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id)

);

-- =====================================================
-- OBJECT DETECTION
-- =====================================================

CREATE TABLE detection_logs(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    mission_id INTEGER,

    timestamp DATETIME,

    object_name TEXT,

    confidence REAL,

    image_path TEXT,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id)

);

-- =====================================================
-- IMAGES
-- =====================================================

CREATE TABLE images(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    mission_id INTEGER,

    timestamp DATETIME,

    image_path TEXT,

    description TEXT,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id)

);

-- =====================================================
-- VIDEOS
-- =====================================================

CREATE TABLE videos(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    mission_id INTEGER,

    timestamp DATETIME,

    video_path TEXT,

    duration REAL,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id)

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
    REFERENCES missions(id)

);

-- =====================================================
-- ERROR LOG
-- =====================================================

CREATE TABLE error_logs(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    mission_id INTEGER,

    timestamp DATETIME,

    node TEXT,

    level TEXT,

    message TEXT,

    FOREIGN KEY(mission_id)
    REFERENCES missions(id)

);

-- =====================================================
-- SYSTEM LOG
-- =====================================================

CREATE TABLE system_logs(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    timestamp DATETIME,

    cpu REAL,

    ram REAL,

    disk REAL,

    cpu_temperature REAL,

    gpu_temperature REAL

);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_blackbox_time
ON blackbox(timestamp);

CREATE INDEX idx_battery_time
ON battery_logs(timestamp);

CREATE INDEX idx_sensor_time
ON sensor_logs(timestamp);

CREATE INDEX idx_motor_time
ON motor_logs(timestamp);

CREATE INDEX idx_navigation_time
ON navigation_logs(timestamp);

CREATE INDEX idx_detection_time
ON detection_logs(timestamp);

CREATE INDEX idx_ai_time
ON ai_logs(timestamp);

CREATE INDEX idx_error_time
ON error_logs(timestamp);

-- =====================================================
-- END
-- =====================================================
