#!/usr/bin/env python3
"""
Migration: Add address column to enquiries table

This migration adds a dedicated address column to the enquiries table
so that customer address is stored separately from notes.

Run with: python migrations/add_enquiry_address.py
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine, SessionLocal

def run_migration():
    """Add address column to enquiries table"""
    
    with engine.connect() as conn:
        # Check if column already exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'enquiries' AND column_name = 'address'
        """))
        
        if result.fetchone():
            print("✓ Column 'address' already exists in enquiries table")
            return
        
        # Add the column
        print("Adding 'address' column to enquiries table...")
        conn.execute(text("""
            ALTER TABLE enquiries 
            ADD COLUMN address TEXT NOT NULL DEFAULT ''
        """))
        conn.commit()
        print("✓ Successfully added 'address' column to enquiries table")
        
        # Migrate existing data: Extract address from notes if it exists
        print("Migrating existing address data from notes...")
        
        # Get all enquiries with notes containing 'Address:'
        db = SessionLocal()
        try:
            result = conn.execute(text("""
                SELECT id, notes FROM enquiries 
                WHERE notes IS NOT NULL AND notes LIKE '%Address:%'
            """))
            
            updated_count = 0
            for row in result.fetchall():
                enquiry_id = row[0]
                notes = row[1]
                
                # Extract address from notes
                if 'Address:' in notes:
                    lines = notes.split('\n')
                    address_line = None
                    for line in lines:
                        if line.startswith('Address:'):
                            address_line = line.replace('Address:', '').strip()
                            break
                    
                    if address_line:
                        # Update the address column
                        conn.execute(
                            text("UPDATE enquiries SET address = :addr WHERE id = :id"),
                            {"addr": address_line, "id": enquiry_id}
                        )
                        updated_count += 1
            
            conn.commit()
            print(f"✓ Migrated address for {updated_count} existing enquiries")
            
        finally:
            db.close()

def rollback_migration():
    """Remove address column from enquiries table (rollback)"""
    
    with engine.connect() as conn:
        print("Rolling back: Removing 'address' column from enquiries table...")
        conn.execute(text("""
            ALTER TABLE enquiries DROP COLUMN IF EXISTS address
        """))
        conn.commit()
        print("✓ Rollback complete")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Add enquiry address migration')
    parser.add_argument('--rollback', action='store_true', help='Rollback the migration')
    args = parser.parse_args()
    
    if args.rollback:
        rollback_migration()
    else:
        run_migration()
