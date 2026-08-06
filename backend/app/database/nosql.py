from tinydb import TinyDB, Query
import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any

class NoSQLDatabase:
    """Wrapper class for TinyDB NoSQL storage to save complex/flexible structures with auto-corruption recovery."""
    
    def __init__(self, db_path: str = None):
        if db_path is None:
            base_dir = Path(__file__).resolve().parents[3] / "database"
            db_path = base_dir / "nosql_db.json"
        
        self.db_path = Path(db_path)
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._init_db()

    def _init_db(self):
        try:
            self.db = TinyDB(str(self.db_path))
        except Exception:
            try:
                with open(str(self.db_path), 'w', encoding='utf-8') as f:
                    f.write('{}')
                self.db = TinyDB(str(self.db_path))
            except Exception:
                self.db = None

    def insert_detection(self, mission_id: int, detections: List[Dict[str, Any]]) -> str:
        try:
            if self.db is None:
                self._init_db()
            doc_id = self.db.insert({
                "type": "detection",
                "mission_id": mission_id,
                "timestamp": datetime.now().isoformat(),
                "detections": detections
            })
            return str(doc_id)
        except Exception:
            self._init_db()
            return ""

    def insert_error(self, mission_id: int, node: str, level: str, message: str) -> str:
        try:
            if self.db is None:
                self._init_db()
            doc_id = self.db.insert({
                "type": "error",
                "mission_id": mission_id,
                "timestamp": datetime.now().isoformat(),
                "node": node,
                "level": level,
                "message": message
            })
            return str(doc_id)
        except Exception:
            self._init_db()
            return ""

    def insert_conversation(self, mission_id: int, prompt: str, reply: str) -> str:
        try:
            if self.db is None:
                self._init_db()
            doc_id = self.db.insert({
                "type": "conversation",
                "mission_id": mission_id,
                "timestamp": datetime.now().isoformat(),
                "prompt": prompt,
                "reply": reply
            })
            return str(doc_id)
        except Exception:
            self._init_db()
            return ""

    def get_detections(self, mission_id: int = None) -> List[Dict[str, Any]]:
        try:
            if self.db is None:
                self._init_db()
            Doc = Query()
            if mission_id is not None:
                return self.db.search((Doc.type == "detection") & (Doc.mission_id == mission_id))
            return self.db.search(Doc.type == "detection")
        except Exception:
            self._init_db()
            return []

    def get_errors(self, mission_id: int = None) -> List[Dict[str, Any]]:
        try:
            if self.db is None:
                self._init_db()
            Doc = Query()
            if mission_id is not None:
                return self.db.search((Doc.type == "error") & (Doc.mission_id == mission_id))
            return self.db.search(Doc.type == "error")
        except Exception:
            self._init_db()
            return []

    def get_conversations(self, mission_id: int = None) -> List[Dict[str, Any]]:
        try:
            if self.db is None:
                self._init_db()
            Doc = Query()
            if mission_id is not None:
                return self.db.search((Doc.type == "conversation") & (Doc.mission_id == mission_id))
            return self.db.search(Doc.type == "conversation")
        except Exception:
            self._init_db()
            return []

    def clear_all(self):
        try:
            if self.db is None:
                self._init_db()
            self.db.truncate()
        except Exception:
            self._init_db()

# Singleton Instance
nosql_db = NoSQLDatabase()
