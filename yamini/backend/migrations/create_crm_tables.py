"""
Migration script: Create professional CRM tables (leads + call_logs)
Run this script to create the new tables for CRM functionality.
"""

from database import engine, SessionLocal
from models import Base, Lead, CallLog
from sqlalchemy import text

def migrate():
    print("🚀 Starting Professional CRM Migration...")
    
    db = SessionLocal()
    
    try:
        # Create tables
        print("Creating 'leads' table...")
        print("Creating 'call_logs' table...")
        
        Base.metadata.create_all(bind=engine, tables=[Lead.__table__, CallLog.__table__])
        
        print("✅ Tables created successfully!")
        print("\n📋 Migration Summary:")
        print("  ✓ leads - ONE row per customer (latest state)")
        print("  ✓ call_logs - Complete call history")
        print("\n✨ Professional CRM structure ready!")
        print("\n⚠️  NOTE: Old 'reception_calls' table kept for backward compatibility")
        print("   You can migrate existing data manually if needed.")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
