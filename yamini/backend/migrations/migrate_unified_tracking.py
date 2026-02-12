"""
Migration: Align database schema with unified tracking models.
Run once: python3 migrations/migrate_unified_tracking.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        # ── 1. tracking_sessions: rename 'date' → 'session_date', add 'auto_stopped'
        result = conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'tracking_sessions'"
        ))
        cols = [r[0] for r in result]
        print(f"tracking_sessions columns: {cols}")

        if 'date' in cols and 'session_date' not in cols:
            conn.execute(text(
                "ALTER TABLE tracking_sessions RENAME COLUMN date TO session_date"
            ))
            print("  -> Renamed 'date' to 'session_date'")
        elif 'session_date' in cols:
            print("  -> 'session_date' already exists")

        if 'auto_stopped' not in cols:
            conn.execute(text(
                "ALTER TABLE tracking_sessions ADD COLUMN auto_stopped BOOLEAN DEFAULT FALSE"
            ))
            print("  -> Added 'auto_stopped' column")
        else:
            print("  -> 'auto_stopped' already exists")

        # ── 2. Add unique constraint if missing
        result = conn.execute(text(
            "SELECT constraint_name FROM information_schema.table_constraints "
            "WHERE table_name = 'tracking_sessions' AND constraint_type = 'UNIQUE'"
        ))
        constraints = [r[0] for r in result]
        print(f"  Unique constraints: {constraints}")

        if 'uq_tracking_user_session_date' not in constraints:
            try:
                conn.execute(text(
                    "ALTER TABLE tracking_sessions "
                    "ADD CONSTRAINT uq_tracking_user_session_date UNIQUE (user_id, session_date)"
                ))
                print("  -> Added unique constraint (user_id, session_date)")
            except Exception as e:
                print(f"  -> Constraint skipped: {e}")
        else:
            print("  -> Unique constraint already present")

        # ── 3. geofence_events: old schema is completely different — drop & recreate
        conn.execute(text("DROP TABLE IF EXISTS geofence_events CASCADE"))
        print("geofence_events: dropped old table (will be recreated by create_all)")

        # ── 4. route_summary: model uses 'route_summary', old DB has 'route_summaries'
        #    Just let create_all handle creating the new 'route_summary' table.
        result = conn.execute(text(
            "SELECT 1 FROM information_schema.tables WHERE table_name = 'route_summary'"
        ))
        if result.fetchone():
            print("route_summary: table already exists")
        else:
            print("route_summary: will be created by create_all on next startup")

        # ── 5. Add index on session_date if not exists
        try:
            conn.execute(text(
                "CREATE INDEX IF NOT EXISTS ix_tracking_sessions_session_date "
                "ON tracking_sessions (session_date)"
            ))
            print("  -> Index on session_date ensured")
        except Exception as e:
            print(f"  -> Index skipped: {e}")

        conn.commit()
        print("\n✅ Migration complete!")

        # ── 6. Now run create_all to create any missing tables
        print("\nRunning create_all to create new tables...")

    # Import models and create all
    import models
    models.Base.metadata.create_all(bind=engine)
    print("✅ create_all complete — all new tables created.")

    # Verify final state
    with engine.connect() as conn:
        result = conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'tracking_sessions' ORDER BY ordinal_position"
        ))
        cols = [r[0] for r in result]
        print(f"\nFinal tracking_sessions columns: {cols}")

        for table in ['route_summary', 'geofence_events', 'visit_logs',
                       'unified_live_locations', 'device_status_logs']:
            result = conn.execute(text(
                f"SELECT 1 FROM information_schema.tables WHERE table_name = '{table}'"
            ))
            exists = result.fetchone() is not None
            print(f"  {table}: {'EXISTS' if exists else 'MISSING'}")


if __name__ == "__main__":
    run_migration()
