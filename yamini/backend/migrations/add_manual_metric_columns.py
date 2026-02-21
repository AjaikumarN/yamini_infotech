"""
Migration: Add manual metric columns to daily_reports
Date: 2026-01-21

Adds:
- manual_calls (INTEGER, default 0)
- manual_meetings (INTEGER, default 0)
- manual_orders (INTEGER, default 0)

These fields allow salesmen to supplement auto-derived metrics with manual adjustments.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection - use same config as main app
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/yamini_infotech"
)
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


def run_migration():
    """Run the migration to add manual metric columns to daily_reports"""
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("MIGRATION: Manual Metric Columns for Daily Reports")
        print("=" * 60)
        
        # Check if columns already exist
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'daily_reports'
        """)).fetchall()
        
        existing_columns = [row[0] for row in result]
        print(f"\nExisting columns: {existing_columns}")
        
        # Add manual_calls column
        if 'manual_calls' not in existing_columns:
            db.execute(text("""
                ALTER TABLE daily_reports 
                ADD COLUMN manual_calls INTEGER DEFAULT 0
            """))
            print("✅ Added 'manual_calls' column")
        else:
            print("⏭️  'manual_calls' already exists")
        
        # Add manual_meetings column
        if 'manual_meetings' not in existing_columns:
            db.execute(text("""
                ALTER TABLE daily_reports 
                ADD COLUMN manual_meetings INTEGER DEFAULT 0
            """))
            print("✅ Added 'manual_meetings' column")
        else:
            print("⏭️  'manual_meetings' already exists")
        
        # Add manual_orders column
        if 'manual_orders' not in existing_columns:
            db.execute(text("""
                ALTER TABLE daily_reports 
                ADD COLUMN manual_orders INTEGER DEFAULT 0
            """))
            print("✅ Added 'manual_orders' column")
        else:
            print("⏭️  'manual_orders' already exists")
        
        db.commit()
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_migration()
