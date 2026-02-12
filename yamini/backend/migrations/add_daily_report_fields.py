"""
Migration: Add enhanced daily report fields
Date: 2026-01-20

Adds:
- achievements (TEXT)
- challenges (TEXT)
- tomorrow_plan (TEXT)
- attendance_id (FK to attendance.id)

These fields support the enhanced Salesman Daily Report feature.
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
    """Run the migration to add daily report fields"""
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("MIGRATION: Enhanced Daily Report Fields")
        print("=" * 60)
        
        # Check if columns already exist
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'daily_reports'
        """)).fetchall()
        
        existing_columns = [row[0] for row in result]
        print(f"\nExisting columns: {existing_columns}")
        
        # Add achievements column
        if 'achievements' not in existing_columns:
            db.execute(text("ALTER TABLE daily_reports ADD COLUMN achievements TEXT"))
            print("✅ Added 'achievements' column")
        else:
            print("⏭️  'achievements' column already exists")
        
        # Add challenges column
        if 'challenges' not in existing_columns:
            db.execute(text("ALTER TABLE daily_reports ADD COLUMN challenges TEXT"))
            print("✅ Added 'challenges' column")
        else:
            print("⏭️  'challenges' column already exists")
        
        # Add tomorrow_plan column
        if 'tomorrow_plan' not in existing_columns:
            db.execute(text("ALTER TABLE daily_reports ADD COLUMN tomorrow_plan TEXT"))
            print("✅ Added 'tomorrow_plan' column")
        else:
            print("⏭️  'tomorrow_plan' column already exists")
        
        # Add attendance_id column with FK
        if 'attendance_id' not in existing_columns:
            db.execute(text("ALTER TABLE daily_reports ADD COLUMN attendance_id INTEGER"))
            # Add foreign key constraint
            try:
                db.execute(text("""
                    ALTER TABLE daily_reports 
                    ADD CONSTRAINT fk_daily_reports_attendance 
                    FOREIGN KEY (attendance_id) REFERENCES attendance(id)
                """))
                print("✅ Added 'attendance_id' column with FK constraint")
            except Exception as e:
                print(f"✅ Added 'attendance_id' column (FK constraint may already exist: {e})")
        else:
            print("⏭️  'attendance_id' column already exists")
        
        db.commit()
        
        print("\n" + "=" * 60)
        print("✅ MIGRATION COMPLETE")
        print("=" * 60)
        
        # Verify final state
        result = db.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'daily_reports'
            ORDER BY ordinal_position
        """)).fetchall()
        
        print("\nFinal daily_reports table structure:")
        for col_name, col_type in result:
            print(f"  - {col_name}: {col_type}")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Migration failed: {e}")
        return False
        
    finally:
        db.close()


if __name__ == "__main__":
    run_migration()
