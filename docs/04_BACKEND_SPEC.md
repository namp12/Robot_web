# 04 - Backend Specification

Backend xây dựng theo chuẩn **Clean Architecture**:
```
app/
├── api/          # Routers tiếp nhận request & trả response Pydantic
├── services/     # Business logic & tương tác với ROS2 Bridge / Database
├── models/       # Declarative ORM models SQLAlchemy 2.x
├── schemas/      # Pydantic v2 validation DTOs
├── ros/          # rclpy background spin manager & ROS2 node bridge
├── websocket/    # Real-time WebSocket streaming
└── main.py       # FastAPI Entrypoint
```
- **Công nghệ:** Python 3.12, FastAPI, SQLAlchemy 2.0 (Async), Pydantic v2, uvicorn, rclpy.
