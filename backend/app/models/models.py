from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class Robot(Base):
    __tablename__ = "robots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    robot_name: Mapped[str] = mapped_column(String(100), nullable=False)
    serial_number: Mapped[Optional[str]] = mapped_column(String(100), unique=True)
    model: Mapped[Optional[str]] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    settings = relationship("RobotSetting", back_populates="robot", uselist=False, cascade="all, delete-orphan")
    maps = relationship("MapModel", back_populates="robot", cascade="all, delete-orphan")
    missions = relationship("Mission", back_populates="robot")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    fullname: Mapped[Optional[str]] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(20), default="user")
    is_active: Mapped[int] = mapped_column(Integer, default=1)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    created_missions = relationship("Mission", back_populates="creator")


class RobotSetting(Base):
    __tablename__ = "robot_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    robot_id: Mapped[Optional[int]] = mapped_column(ForeignKey("robots.id", ondelete="CASCADE"))

    max_speed: Mapped[float] = mapped_column(Float, default=1.0)
    max_pwm: Mapped[int] = mapped_column(Integer, default=255)

    ros_domain_id: Mapped[int] = mapped_column(Integer, default=0)
    robot_ip: Mapped[Optional[str]] = mapped_column(String(50))
    ws_port: Mapped[int] = mapped_column(Integer, default=8000)

    lidar_port: Mapped[Optional[str]] = mapped_column(String(50))
    lidar_baudrate: Mapped[Optional[int]] = mapped_column(Integer)

    camera_enabled: Mapped[int] = mapped_column(Integer, default=1)
    camera_device: Mapped[str] = mapped_column(String(50), default="/dev/video0")
    camera_width: Mapped[int] = mapped_column(Integer, default=1280)
    camera_height: Mapped[int] = mapped_column(Integer, default=720)
    camera_fps: Mapped[int] = mapped_column(Integer, default=30)

    ai_enabled: Mapped[int] = mapped_column(Integer, default=1)
    ai_model_name: Mapped[str] = mapped_column(String(50), default="yolov8n")
    ai_confidence_threshold: Mapped[float] = mapped_column(Float, default=0.5)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    robot = relationship("Robot", back_populates="settings")


class MapModel(Base):
    __tablename__ = "maps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    robot_id: Mapped[Optional[int]] = mapped_column(ForeignKey("robots.id", ondelete="CASCADE"))

    map_name: Mapped[str] = mapped_column(String(100), nullable=False)
    yaml_path: Mapped[Optional[str]] = mapped_column(String(255))
    image_path: Mapped[Optional[str]] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)

    resolution: Mapped[float] = mapped_column(Float, default=0.05)
    origin_x: Mapped[float] = mapped_column(Float, default=0.0)
    origin_y: Mapped[float] = mapped_column(Float, default=0.0)
    origin_yaw: Mapped[float] = mapped_column(Float, default=0.0)
    width: Mapped[Optional[int]] = mapped_column(Integer)
    height: Mapped[Optional[int]] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    robot = relationship("Robot", back_populates="maps")
    waypoints = relationship("Waypoint", back_populates="map_rel", cascade="all, delete-orphan")
    missions = relationship("Mission", back_populates="map_rel")


class Waypoint(Base):
    __tablename__ = "waypoints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    map_id: Mapped[int] = mapped_column(ForeignKey("maps.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    pos_x: Mapped[float] = mapped_column(Float, nullable=False)
    pos_y: Mapped[float] = mapped_column(Float, nullable=False)
    yaw: Mapped[float] = mapped_column(Float, default=0.0)
    description: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    map_rel = relationship("MapModel", back_populates="waypoints")


class Mission(Base):
    __tablename__ = "missions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    robot_id: Mapped[Optional[int]] = mapped_column(ForeignKey("robots.id", ondelete="SET NULL"))
    map_id: Mapped[Optional[int]] = mapped_column(ForeignKey("maps.id", ondelete="SET NULL"))
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

    mission_name: Mapped[Optional[str]] = mapped_column(String(100))
    status: Mapped[Optional[str]] = mapped_column(String(50))
    start_time: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime)
    note: Mapped[Optional[str]] = mapped_column(Text)

    robot = relationship("Robot", back_populates="missions")
    map_rel = relationship("MapModel", back_populates="missions")
    creator = relationship("User", back_populates="created_missions")
    blackboxes = relationship("BlackBox", back_populates="mission", cascade="all, delete-orphan")


class BlackBox(Base):
    __tablename__ = "blackbox"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    mission_id: Mapped[Optional[int]] = mapped_column(ForeignKey("missions.id", ondelete="CASCADE"))
    timestamp: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)

    pos_x: Mapped[Optional[float]] = mapped_column(Float)
    pos_y: Mapped[Optional[float]] = mapped_column(Float)
    yaw: Mapped[Optional[float]] = mapped_column(Float)

    linear_speed: Mapped[Optional[float]] = mapped_column(Float)
    angular_speed: Mapped[Optional[float]] = mapped_column(Float)

    battery: Mapped[Optional[float]] = mapped_column(Float)
    cpu: Mapped[Optional[float]] = mapped_column(Float)
    ram: Mapped[Optional[float]] = mapped_column(Float)
    wifi_signal: Mapped[Optional[int]] = mapped_column(Integer)

    event: Mapped[Optional[str]] = mapped_column(Text)

    mission = relationship("Mission", back_populates="blackboxes")


class SystemLog(Base):
    __tablename__ = "system_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)

    cpu: Mapped[Optional[float]] = mapped_column(Float)
    ram: Mapped[Optional[float]] = mapped_column(Float)
    disk: Mapped[Optional[float]] = mapped_column(Float)
    cpu_temperature: Mapped[Optional[float]] = mapped_column(Float)
    gpu_temperature: Mapped[Optional[float]] = mapped_column(Float)
