from tinydb import TinyDB, Query
import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any

class NoSQLDatabase:
    """Wrapper class for TinyDB NoSQL storage to save complex/flexible structures."""
    
    def __init__(self, db_path: str = None):
        if db_path is None:
            # Resolve path to d:\Robot_web\database\nosql_db.json
            # Relative to d:\Robot_web\backend\app\database\nosql.py
            base_dir = Path(__file__).resolve().parents[3] / "database"
            db_path = base_dir / "nosql_db.json"
        
        # Ensure database folder exists
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.db = TinyDB(str(db_path))

    def insert_detection(self, mission_id: int, detections: List[Dict[str, Any]]) -> str:
        """
        Insert AI detection records.
        detections format: [{"object_name": "person", "confidence": 0.85, "bbox": [x, y, w, h]}, ...]
        """
        doc_id = self.db.insert({
            "type": "detection",
            "mission_id": mission_id,
            "timestamp": datetime.now().isoformat(),
            "detections": detections
        })
        return str(doc_id)

    def insert_error(self, mission_id: int, node: str, level: str, message: str) -> str:
        """Insert a system node error log."""
        doc_id = self.db.insert({
            "type": "error",
            "mission_id": mission_id,
            "timestamp": datetime.now().isoformat(),
            "node": node,
            "level": level,
            "message": message
        })
        return str(doc_id)

    def insert_conversation(self, mission_id: int, prompt: str, reply: str) -> str:
        """Insert AI dialogue conversation log."""
        doc_id = self.db.insert({
            "type": "conversation",
            "mission_id": mission_id,
            "timestamp": datetime.now().isoformat(),
            "prompt": prompt,
            "reply": reply
        })
        return str(doc_id)

    def get_detections(self, mission_id: int = None) -> List[Dict[str, Any]]:
        """Retrieve AI detections, optionally filtered by mission_id."""
        Doc = Query()
        if mission_id is not None:
            return self.db.search((Doc.type == "detection") & (Doc.mission_id == mission_id))
        return self.db.search(Doc.type == "detection")

    def get_errors(self, mission_id: int = None) -> List[Dict[str, Any]]:
        """Retrieve error logs, optionally filtered by mission_id."""
        Doc = Query()
        if mission_id is not None:
            return self.db.search((Doc.type == "error") & (Doc.mission_id == mission_id))
        return self.db.search(Doc.type == "error")

    def get_conversations(self, mission_id: int = None) -> List[Dict[str, Any]]:
        """Retrieve conversation logs, optionally filtered by mission_id."""
        Doc = Query()
        if mission_id is not None:
            return self.db.search((Doc.type == "conversation") & (Doc.mission_id == mission_id))
        return self.db.search(Doc.type == "conversation")

    def clear_all(self):
        """Clear all records in NoSQL database."""
        self.db.truncate()

# Singleton Instance
nosql_db = NoSQLDatabase()
