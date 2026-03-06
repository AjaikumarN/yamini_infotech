"""
Migration: Add category and sub_type columns to stock_movements table
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__) + '/..')

from database import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        # Add category column
        conn.execute(text("""
            ALTER TABLE stock_movements 
            ADD COLUMN IF NOT EXISTS category VARCHAR;
        """))
        
        # Add sub_type column
        conn.execute(text("""
            ALTER TABLE stock_movements 
            ADD COLUMN IF NOT EXISTS sub_type VARCHAR;
        """))
        
        conn.commit()
        print("Migration successful: Added category and sub_type columns to stock_movements")

if __name__ == "__main__":
    run_migration()
