"""
Migration: Add enhanced stock movement fields for service-linked tracking
Date: 2024
Purpose: Adds engineer accountability, payment tracking, and service linkage to stock movements

This migration adds the following columns to stock_movements table:
- service_request_id: Links stock OUT to a specific service request (mandatory for OUT)
- engineer_id: Tracks which engineer took the stock (mandatory for OUT)
- payment_status: PAID or PENDING status for the movement
- notes: Additional notes for the movement

Run this migration once to update your database schema.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from database import DATABASE_URL, engine

def upgrade():
    """Add new columns to stock_movements table"""
    
    with engine.connect() as conn:
        # Check if columns already exist (PostgreSQL approach)
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'stock_movements'
        """))
        existing_columns = [row[0] for row in result.fetchall()]
        
        migrations = []
        
        # Core enhanced fields
        if 'service_request_id' not in existing_columns:
            migrations.append("ALTER TABLE stock_movements ADD COLUMN service_request_id INTEGER REFERENCES complaints(id)")
        
        if 'engineer_id' not in existing_columns:
            migrations.append("ALTER TABLE stock_movements ADD COLUMN engineer_id INTEGER REFERENCES users(id)")
        
        if 'notes' not in existing_columns:
            migrations.append("ALTER TABLE stock_movements ADD COLUMN notes TEXT")
        
        # NEW: Separate Approval Status (rename old status column)
        if 'approval_status' not in existing_columns:
            migrations.append("ALTER TABLE stock_movements ADD COLUMN approval_status VARCHAR DEFAULT 'PENDING'")
        
        if 'approved_at' not in existing_columns:
            migrations.append("ALTER TABLE stock_movements ADD COLUMN approved_at TIMESTAMP")
        
        # NEW: Payment Status (financial truth)
        if 'payment_status' not in existing_columns:
            migrations.append("ALTER TABLE stock_movements ADD COLUMN payment_status VARCHAR DEFAULT 'UNBILLED'")
        
        if 'invoice_reference' not in existing_columns:
            migrations.append("ALTER TABLE stock_movements ADD COLUMN invoice_reference VARCHAR")
        
        if 'payment_updated_by' not in existing_columns:
            migrations.append("ALTER TABLE stock_movements ADD COLUMN payment_updated_by INTEGER REFERENCES users(id)")
        
        if 'payment_updated_at' not in existing_columns:
            migrations.append("ALTER TABLE stock_movements ADD COLUMN payment_updated_at TIMESTAMP")
        
        # NEW: Reference type fields
        if 'reference_type' not in existing_columns:
            migrations.append("ALTER TABLE stock_movements ADD COLUMN reference_type VARCHAR")
        
        if 'reference_id' not in existing_columns:
            migrations.append("ALTER TABLE stock_movements ADD COLUMN reference_id VARCHAR")
        
        # Execute migrations
        for migration in migrations:
            print(f"Running: {migration}")
            try:
                conn.execute(text(migration))
                print("  ✓ Success")
            except Exception as e:
                print(f"  ✗ Error: {e}")
        
        conn.commit()
        
        if migrations:
            print(f"\n✅ Migration complete! Added {len(migrations)} new columns.")
        else:
            print("\n✅ All columns already exist. No migration needed.")


def downgrade():
    """Remove added columns"""
    print("To downgrade, run:")
    print("  ALTER TABLE stock_movements DROP COLUMN service_request_id;")
    print("  ALTER TABLE stock_movements DROP COLUMN engineer_id;")
    print("  ALTER TABLE stock_movements DROP COLUMN payment_status;")
    print("  ALTER TABLE stock_movements DROP COLUMN notes;")


if __name__ == "__main__":
    print("=" * 60)
    print("STOCK MOVEMENTS MIGRATION")
    print("Adding engineer accountability & payment tracking fields")
    print("=" * 60)
    print()
    upgrade()
