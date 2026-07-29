import sys
import os
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.database.nosql import nosql_db

def run_test():
    print("🧪 Running NoSQL TinyDB Integration Test...")
    
    # 1. Clear database
    print("🧹 Clearing NoSQL DB...")
    nosql_db.clear_all()
    
    # 2. Insert test AI detections
    print("📝 Inserting test AI detections...")
    det_id = nosql_db.insert_detection(
        mission_id=42, 
        detections=[
            {"object_name": "robot", "confidence": 0.99, "bbox": [10, 20, 200, 300]},
            {"object_name": "obstacle", "confidence": 0.88, "bbox": [50, 60, 30, 40]}
        ]
    )
    print(f"✅ Inserted detection. Doc ID: {det_id}")
    
    # 3. Insert test error
    print("📝 Inserting test system error log...")
    err_id = nosql_db.insert_error(
        mission_id=42,
        node="/nav2_planner",
        level="CRITICAL",
        message="Global path planning failed: Map is blocked"
    )
    print(f"✅ Inserted error. Doc ID: {err_id}")
    
    # 4. Query detections
    print("\n🔍 Querying detections for mission 42...")
    detections = nosql_db.get_detections(mission_id=42)
    print(f"📊 Found {len(detections)} entries:")
    for d in detections:
        print(f"  - Timestamp: {d['timestamp']}")
        print(f"  - Objects: {d['detections']}")
        
    # 5. Query errors
    print("\n🔍 Querying errors for mission 42...")
    errors = nosql_db.get_errors(mission_id=42)
    print(f"📊 Found {len(errors)} entries:")
    for e in errors:
        print(f"  - Node: {e['node']}")
        print(f"  - Level: {e['level']}")
        print(f"  - Message: {e['message']}")
        
    print("\n🎉 NoSQL Integration Test Completed Successfully!")

if __name__ == "__main__":
    run_test()
