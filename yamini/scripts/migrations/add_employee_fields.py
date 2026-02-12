"""
Migration script to add employee profile fields to users table
Run this script to update the database schema with new employee fields
"""

import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

from sqlalchemy import text
from database import engine

def migrate():
    """Add new employee fields to users table"""
    
    migrations = [
        # Personal Information
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS current_address TEXT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS permanent_address TEXT",
        
        # Identification / KYC
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR UNIQUE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality VARCHAR DEFAULT 'Indian'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS photograph VARCHAR",
        
        # Employment Details
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_joining DATE",
        
        # Salary & Payroll
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS salary FLOAT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_pay FLOAT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS bank VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS account_number VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account VARCHAR",
    ]
    
    with engine.connect() as conn:
        try:
            for migration in migrations:
                print(f"Executing: {migration}")
                conn.execute(text(migration))
                conn.commit()
            print("\n✅ Migration completed successfully!")
            print("All employee profile fields have been added to the users table.")
        except Exception as e:
            print(f"\n❌ Migration failed: {str(e)}")
            conn.rollback()
            raise

if __name__ == "__main__":
    print("Starting migration to add employee profile fields...\n")
    migrate()
