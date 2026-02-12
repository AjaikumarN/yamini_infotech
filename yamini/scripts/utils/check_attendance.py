"""
Check attendance records
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/yamini_infotech"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_attendance():
    db = SessionLocal()
    try:
        # Check all attendance records
        result = db.execute(text("SELECT id, employee_id, attendance_date, status, time FROM attendance ORDER BY attendance_date DESC LIMIT 10"))
        records = result.fetchall()
        
        print(f"\n📋 Recent Attendance Records:")
        print("-" * 80)
        for record in records:
            print(f"ID: {record[0]} | Employee: {record[1]} | Date: {record[2]} | Status: {record[3]} | Time: {record[4]}")
        
        if not records:
            print("No attendance records found")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_attendance()
