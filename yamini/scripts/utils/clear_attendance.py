"""
Clear today's attendance for testing
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import date
import os

# Database connection
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/yamini_infotech"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def clear_today_attendance():
    db = SessionLocal()
    try:
        today = date.today()
        
        # Delete today's attendance records
        result = db.execute(
            text("DELETE FROM attendance WHERE attendance_date = :today"),
            {"today": today}
        )
        db.commit()
        
        print(f"✅ Cleared {result.rowcount} attendance record(s) for {today}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print(f"Clearing attendance for {date.today()}...")
    clear_today_attendance()
