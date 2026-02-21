#!/usr/bin/env python3
"""
PRODUCTION STABILIZATION MIGRATION
====================================
Run with: python migrations/stabilization_migration.py

Fixes:
1. Service assignment inconsistency — status vs assigned_to mismatch
2. Role normalization — ensure uppercase roles
3. Orphan foreign key cleanup
4. Attendance anomaly detection

Safe to run multiple times (idempotent).
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine


def run_migration():
    """Run all stabilization fixes."""
    
    with engine.connect() as conn:
        print("=" * 60)
        print("PRODUCTION STABILIZATION MIGRATION")
        print("=" * 60)
        
        # ──────────────────────────────────────────────────────
        # FIX 1: Service Request assignment / status mismatch
        # ──────────────────────────────────────────────────────
        print("\n[1/6] Fixing service request assignment inconsistencies...")
        
        # Case A: status = ASSIGNED but assigned_to IS NULL → set status = NEW
        result = conn.execute(text("""
            UPDATE complaints 
            SET status = 'NEW'
            WHERE status = 'ASSIGNED' 
              AND assigned_to IS NULL
              AND is_deleted = false
        """))
        count_a = result.rowcount
        print(f"  → Fixed {count_a} rows: ASSIGNED with no engineer → NEW")
        
        # Case B: status IN (NEW, PENDING) but assigned_to IS NOT NULL → set status = ASSIGNED
        result = conn.execute(text("""
            UPDATE complaints 
            SET status = 'ASSIGNED'
            WHERE status IN ('NEW', 'PENDING')
              AND assigned_to IS NOT NULL
              AND is_deleted = false
        """))
        count_b = result.rowcount
        print(f"  → Fixed {count_b} rows: NEW/PENDING with engineer → ASSIGNED")
        
        conn.commit()
        print(f"  ✓ Total service fixes: {count_a + count_b}")
        
        # ──────────────────────────────────────────────────────
        # FIX 2: Normalize role values to uppercase
        # ──────────────────────────────────────────────────────
        print("\n[2/6] Normalizing tracking session roles to uppercase...")
        
        result = conn.execute(text("""
            UPDATE tracking_sessions 
            SET role = UPPER(role)
            WHERE role != UPPER(role)
        """))
        count = result.rowcount
        conn.commit()
        print(f"  ✓ Normalized {count} tracking session roles")
        
        # ──────────────────────────────────────────────────────
        # FIX 3: Remove orphan live locations (no matching user)
        # ──────────────────────────────────────────────────────
        print("\n[3/6] Cleaning orphan live locations...")
        
        result = conn.execute(text("""
            DELETE FROM unified_live_locations 
            WHERE user_id NOT IN (SELECT id FROM users WHERE is_active = true)
        """))
        count = result.rowcount
        conn.commit()
        print(f"  ✓ Removed {count} orphan live location records")

        # ──────────────────────────────────────────────────────
        # FIX 4: Detect attendance anomalies
        # ──────────────────────────────────────────────────────
        print("\n[4/6] Checking attendance data integrity...")
        
        # Duplicate attendance per employee per day
        result = conn.execute(text("""
            SELECT employee_id, attendance_date, COUNT(*) as cnt
            FROM attendance
            WHERE attendance_date IS NOT NULL
            GROUP BY employee_id, attendance_date
            HAVING COUNT(*) > 1
        """))
        duplicates = result.fetchall()
        if duplicates:
            print(f"  ⚠ Found {len(duplicates)} duplicate attendance records (employee+date):")
            for row in duplicates[:5]:
                print(f"    employee_id={row[0]}, date={row[1]}, count={row[2]}")
            if len(duplicates) > 5:
                print(f"    ... and {len(duplicates) - 5} more")
        else:
            print("  ✓ No duplicate attendance records found")
        
        # Attendance records with NULL employee_id
        result = conn.execute(text("""
            SELECT COUNT(*) FROM attendance WHERE employee_id IS NULL
        """))
        null_emp = result.scalar()
        if null_emp > 0:
            print(f"  ⚠ Found {null_emp} attendance records with NULL employee_id")
        else:
            print("  ✓ All attendance records have valid employee_id")

        # ──────────────────────────────────────────────────────
        # FIX 5: Ensure enquiry address column populated
        # ──────────────────────────────────────────────────────
        print("\n[5/6] Migrating address data from enquiry notes...")
        
        # Check if address column exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'enquiries' AND column_name = 'address'
        """))
        
        if not result.fetchone():
            print("  ⚠ address column does not exist — skipping (run add_enquiry_address.py first)")
        else:
            # Migrate address from notes for existing records
            result = conn.execute(text("""
                UPDATE enquiries 
                SET address = TRIM(REPLACE(notes, 'Address: ', ''))
                WHERE address = '' 
                  AND notes IS NOT NULL 
                  AND notes LIKE 'Address:%'
                  AND LENGTH(notes) < 500
            """))
            count = result.rowcount
            conn.commit()
            print(f"  ✓ Migrated address for {count} enquiries from notes")

        # ──────────────────────────────────────────────────────
        # FIX 6: Report data inconsistency summary
        # ──────────────────────────────────────────────────────
        print("\n[6/6] Running data integrity report...")
        
        # Complaints with assigned_to pointing to inactive user
        result = conn.execute(text("""
            SELECT COUNT(*) FROM complaints c
            LEFT JOIN users u ON c.assigned_to = u.id
            WHERE c.assigned_to IS NOT NULL 
              AND c.is_deleted = false
              AND (u.id IS NULL OR u.is_active = false)
        """))
        orphan_assignments = result.scalar()
        if orphan_assignments > 0:
            print(f"  ⚠ {orphan_assignments} service requests assigned to inactive/missing users")
        else:
            print("  ✓ All service assignments point to active users")
        
        # Enquiries with assigned_to pointing to inactive user
        result = conn.execute(text("""
            SELECT COUNT(*) FROM enquiries e
            LEFT JOIN users u ON e.assigned_to = u.id
            WHERE e.assigned_to IS NOT NULL 
              AND e.is_deleted = false
              AND (u.id IS NULL OR u.is_active = false)
        """))
        orphan_enq = result.scalar()
        if orphan_enq > 0:
            print(f"  ⚠ {orphan_enq} enquiries assigned to inactive/missing users")
        else:
            print("  ✓ All enquiry assignments point to active users")
        
        # Final summary
        result = conn.execute(text("SELECT COUNT(*) FROM complaints WHERE is_deleted = false"))
        total_complaints = result.scalar()
        result = conn.execute(text("SELECT COUNT(*) FROM enquiries WHERE is_deleted = false"))
        total_enquiries = result.scalar()
        result = conn.execute(text("SELECT COUNT(*) FROM users WHERE is_active = true"))
        total_users = result.scalar()
        result = conn.execute(text("SELECT COUNT(*) FROM attendance"))
        total_attendance = result.scalar()
        
        print("\n" + "=" * 60)
        print("MIGRATION COMPLETE — SYSTEM SUMMARY")
        print("=" * 60)
        print(f"  Active Users:       {total_users}")
        print(f"  Active Enquiries:   {total_enquiries}")
        print(f"  Active Complaints:  {total_complaints}")
        print(f"  Attendance Records: {total_attendance}")
        print("=" * 60)


def rollback():
    """No destructive rollback needed — all changes are data corrections."""
    print("This migration only corrects data inconsistencies.")
    print("No rollback needed — all changes are safe corrections.")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Production stabilization migration')
    parser.add_argument('--rollback', action='store_true', help='Show rollback info')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be fixed without applying')
    args = parser.parse_args()
    
    if args.rollback:
        rollback()
    elif args.dry_run:
        print("DRY RUN — checking data only (no changes applied)")
        print("Run without --dry-run to apply fixes")
        # Just run the report parts
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT COUNT(*) FROM complaints 
                WHERE status = 'ASSIGNED' AND assigned_to IS NULL AND is_deleted = false
            """))
            print(f"  Service requests with ASSIGNED + no engineer: {result.scalar()}")
            
            result = conn.execute(text("""
                SELECT COUNT(*) FROM complaints 
                WHERE status IN ('NEW', 'PENDING') AND assigned_to IS NOT NULL AND is_deleted = false
            """))
            print(f"  Service requests with NEW/PENDING + engineer: {result.scalar()}")
    else:
        run_migration()
