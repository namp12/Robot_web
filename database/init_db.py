"""
Robot Database Initialization Script
Author: Phuong Nam
Database: SQLite
Project: Robot Thám Hiểm ROS2
"""

import sqlite3
import os
from pathlib import Path


def init_database(db_path='robot.db', sql_path='robot_database.sql'):
    """
    Initialize the SQLite database from SQL schema file
    
    Args:
        db_path: Path to the SQLite database file
        sql_path: Path to the SQL schema file
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Get the directory of the current script
        script_dir = Path(__file__).parent.absolute()
        
        # Construct full paths
        db_full_path = script_dir / db_path
        sql_full_path = script_dir / sql_path
        
        # Check if SQL file exists
        if not sql_full_path.exists():
            print(f"❌ Error: SQL file not found at {sql_full_path}")
            return False
        
        # Remove existing database if it exists
        if db_full_path.exists():
            print(f"⚠️  Database exists at {db_full_path}, removing old version...")
            os.remove(db_full_path)
        
        # Create connection to database
        print(f"📝 Creating database at {db_full_path}...")
        conn = sqlite3.connect(str(db_full_path))
        cursor = conn.cursor()
        
        # Read SQL file
        with open(sql_full_path, 'r', encoding='utf-8') as f:
            sql_script = f.read()
        
        # Execute SQL script
        print("🔧 Executing SQL schema...")
        cursor.executescript(sql_script)
        
        # Commit changes
        conn.commit()
        
        # Get table count
        cursor.execute("SELECT count(*) FROM sqlite_master WHERE type='table'")
        table_count = cursor.fetchone()[0]
        
        # Get index count
        cursor.execute("SELECT count(*) FROM sqlite_master WHERE type='index'")
        index_count = cursor.fetchone()[0]
        
        print(f"✅ Database initialized successfully!")
        print(f"📊 Tables created: {table_count}")
        print(f"📈 Indexes created: {index_count}")
        
        # Close connection
        conn.close()
        
        return True
        
    except sqlite3.Error as e:
        print(f"❌ SQLite Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def verify_database(db_path='robot.db'):
    """
    Verify the database structure
    
    Args:
        db_path: Path to the SQLite database file
    
    Returns:
        bool: True if database is valid, False otherwise
    """
    try:
        script_dir = Path(__file__).parent.absolute()
        db_full_path = script_dir / db_path
        
        if not db_full_path.exists():
            print(f"❌ Database not found at {db_full_path}")
            return False
        
        conn = sqlite3.connect(str(db_full_path))
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = cursor.fetchall()
        
        print(f"\n📋 Database Tables ({len(tables)}):")
        for table in tables:
            print(f"  - {table[0]}")
        
        # Get all indexes
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index' ORDER BY name")
        indexes = cursor.fetchall()
        
        print(f"\n📈 Database Indexes ({len(indexes)}):")
        for idx in indexes:
            print(f"  - {idx[0]}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == '__main__':
    print("=" * 50)
    print("🤖 Robot Database Initialization")
    print("=" * 50)
    
    # Initialize database
    if init_database():
        print("\n" + "=" * 50)
        # Verify database
        verify_database()
    else:
        print("❌ Failed to initialize database")
    
    print("\n" + "=" * 50)
