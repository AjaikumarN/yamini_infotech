"""
Add attendance_date field migration (SQLAlchemy direct)
"""
import sys
sys.path.append('.')

from sqlalchemy import create_engine, text
from database import DATABASE_URL
import models

def run_migration():
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as connection:
        # Start transaction
        trans = connection.begin()
        
        try:
            print("🔧 Adding attendance_date column...")
            
            # Add attendance_date column
            connection.execute(text("""
                ALTER TABLE attendance 
                ADD COLUMN IF NOT EXISTS attendance_date DATE
            """))
            
            print("📅 Populating attendance_date from existing date field...")
            
            # Populate attendance_date (convert to date part, assuming stored as local time)
            connection.execute(text("""
                UPDATE attendance
                SET attendance_date = date::date
                WHERE attendance_date IS NULL
            """))
            
            print("🔒 Making attendance_date non-nullable...")
            
            # Make it non-nullable
            connection.execute(text("""
                ALTER TABLE attendance 
                ALTER COLUMN attendance_date SET NOT NULL
            """))
            
            print("⚡ Creating indexes...")
            
            # Add non-unique index first
            connection.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_attendance_date 
                ON attendance(attendance_date)
            """))
            
            print("🧹 Removing duplicate attendance records (keeping latest)...")
            
            # Delete duplicates, keeping only the most recent record per employee per day
            connection.execute(text("""
                DELETE FROM attendance
                WHERE id NOT IN (
                    SELECT MAX(id)
                    FROM attendance
                    GROUP BY employee_id, attendance_date
                )
            """))
            
            print("🔐 Creating unique constraint...")
            
            # Now add unique index
            connection.execute(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_employee_date 
                ON attendance(employee_id, attendance_date)
            """))
            
            # Commit transaction
            trans.commit()
            
            print("✅ Migration completed successfully!")
            print("")
            print("📊 Attendance records updated:")
            
            # Show sample records
            result = connection.execute(text("""
                SELECT id, employee_id, date, attendance_date, status 
                FROM attendance 
                ORDER BY date DESC 
                LIMIT 5
            """))
            
            for row in result:
                print(f"  ID: {row[0]}, Employee: {row[1]}, DateTime: {row[2]}, Date: {row[3]}, Status: {row[4]}")
            
        except Exception as e:
            trans.rollback()
            print(f"❌ Migration failed: {e}")
            raise

if __name__ == "__main__":
    run_migration()
