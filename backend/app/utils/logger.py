import os
import logging
from logging.handlers import RotatingFileHandler

# Ensure logs directory exists
LOGS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "logs")
os.makedirs(LOGS_DIR, exist_ok=True)
LOG_FILE_PATH = os.path.join(LOGS_DIR, "robot_system.log")

# Setup Rotating File Handler (Max 10 MB per file, keep 5 backups)
file_handler = RotatingFileHandler(
    LOG_FILE_PATH,
    maxBytes=10 * 1024 * 1024,
    backupCount=5,
    encoding="utf-8"
)
formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s")
file_handler.setFormatter(formatter)

logger = logging.getLogger("RobotPlatform")
logger.setLevel(logging.INFO)
if not logger.handlers:
    logger.addHandler(file_handler)

def get_logger(name: str) -> logging.Logger:
    sub_logger = logging.getLogger(name)
    sub_logger.setLevel(logging.INFO)
    if not any(isinstance(h, RotatingFileHandler) for h in sub_logger.handlers):
        sub_logger.addHandler(file_handler)
    return sub_logger
