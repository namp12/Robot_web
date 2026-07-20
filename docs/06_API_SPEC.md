# 06 - API Specification

### Endpoints RESTful (/api/v1):
- `GET /robot/status`, `GET /robot/system`, `GET /robot/battery`, `POST /robot/emergency-stop`
- `GET /missions`, `POST /missions`, `PUT /missions/{id}`, `DELETE /missions/{id}`
- `GET /maps`, `POST /maps`, `POST /slam/start`, `POST /slam/stop`, `POST /slam/save`
- `GET /navigation/status`, `POST /navigation/goal`, `POST /navigation/cancel`
- `GET /camera/status`, `POST /camera/start`, `POST /camera/stop`, `POST /camera/capture`
- `POST /ai/chat`
- `GET /blackbox` & `GET /system`

### WebSocket:
- `/ws/status` (Phát gói tin TelemetryPacket mỗi 1s).
