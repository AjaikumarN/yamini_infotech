"""
Migration: Add partial payment fields to stock_movements
Date: 2026-03-06
Purpose: Adds paid_amount and total_cost columns to support partial payment tracking

New columns:
- paid_amount: Amount paid so far (for partial payment support)
- total_cost: Total cost for this movement

Run this migration once to update your database schema.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine


def upgrade():
    """Add new columns to stock_movements table"""

    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'stock_movements'
        """))
        existing_columns = [row[0] for row in result.fetchall()]

        migrations = []

        if 'paid_amount' not in existing_columns:
            migrations.append(
                "ALTER TABLE stock_movements ADD COLUMN paid_amount FLOAT DEFAULT 0.0"
            )

        if 'total_cost' not in existing_columns:
            migrations.append(
                "ALTER TABLE stock_movements ADD COLUMN total_cost FLOAT DEFAULT 0.0"
            )

        if migrations:
            for sql in migrations:
                print(f"  Running: {sql}")
                conn.execute(text(sql))
            conn.commit()
            print(f"Successfully added {len(migrations)} column(s)")
        else:
            print("All columns already exist - no migration needed")


if __name__ == "__main__":
    print("Running partial payment migration...")
    upgrade()
    print("Done!")
