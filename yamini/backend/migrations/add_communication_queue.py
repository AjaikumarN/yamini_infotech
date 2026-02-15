"""
Database Migration: Communication Queue & Staff Notifications
=============================================================

Adds:
1. communication_queue — Async message delivery queue (WhatsApp/SMS/Email)
2. staff_notifications — Enhanced internal notification center

Run: python migrations/add_communication_queue.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, SessionLocal
from sqlalchemy import text


def run_migration():
    db = SessionLocal()

    try:
        print("=" * 60)
        print("Communication Queue & Staff Notifications Migration")
        print("=" * 60)

        # ==================================================================
        # 1. communication_queue — External messaging queue
        # ==================================================================
        print("\n📋 Creating communication_queue table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS communication_queue (
                id SERIAL PRIMARY KEY,
                channel VARCHAR(20) NOT NULL DEFAULT 'WHATSAPP',
                recipient_type VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
                recipient_phone VARCHAR(30),
                recipient_user_id INTEGER REFERENCES users(id),
                event_type VARCHAR(80) NOT NULL,
                reference_table VARCHAR(80),
                reference_id INTEGER,
                message_payload_json TEXT,
                status VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
                retry_count INTEGER NOT NULL DEFAULT 0,
                last_error TEXT,
                idempotency_key VARCHAR(200),
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                processed_at TIMESTAMP,
                next_retry_at TIMESTAMP,
                CONSTRAINT uq_comm_idempotency UNIQUE (idempotency_key)
            );
        """))
        db.commit()
        print("   ✅ communication_queue created")

        # Create indexes
        print("   📌 Adding indexes...")
        for idx_sql in [
            "CREATE INDEX IF NOT EXISTS idx_cq_status ON communication_queue(status);",
            "CREATE INDEX IF NOT EXISTS idx_cq_status_retry ON communication_queue(status, next_retry_at);",
            "CREATE INDEX IF NOT EXISTS idx_cq_created ON communication_queue(created_at);",
            "CREATE INDEX IF NOT EXISTS idx_cq_event_type ON communication_queue(event_type);",
        ]:
            db.execute(text(idx_sql))
        db.commit()
        print("   ✅ Indexes created")

        # ==================================================================
        # 2. staff_notifications — Internal notification center
        # ==================================================================
        print("\n📋 Creating staff_notifications table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS staff_notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                module VARCHAR(80),
                entity_type VARCHAR(80),
                entity_id INTEGER,
                priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
                is_read BOOLEAN NOT NULL DEFAULT FALSE,
                action_url VARCHAR(500),
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                read_at TIMESTAMP
            );
        """))
        db.commit()
        print("   ✅ staff_notifications created")

        # Create indexes
        print("   📌 Adding indexes...")
        for idx_sql in [
            "CREATE INDEX IF NOT EXISTS idx_sn_user ON staff_notifications(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_sn_user_unread ON staff_notifications(user_id, is_read) WHERE is_read = FALSE;",
            "CREATE INDEX IF NOT EXISTS idx_sn_created ON staff_notifications(created_at);",
        ]:
            db.execute(text(idx_sql))
        db.commit()
        print("   ✅ Indexes created")

        # ==================================================================
        # Summary
        # ==================================================================
        print("\n" + "=" * 60)
        print("✅ Migration complete!")
        print("   • communication_queue — async message delivery")
        print("   • staff_notifications — internal notification center")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_migration()
