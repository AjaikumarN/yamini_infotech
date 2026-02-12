"""
Add email and company fields to complaints table
"""
from sqlalchemy import create_engine, text
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/yamini_infotech"
)

engine = create_engine(DATABASE_URL)

def add_fields():
    try:
        with engine.connect() as conn:
            # Add email and company columns
            print("Adding email column...")
            conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS email VARCHAR"))
            
            print("Adding company column...")
            conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS company VARCHAR"))
            
            conn.commit()
            print("✅ Fields added successfully!")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    add_fields()
