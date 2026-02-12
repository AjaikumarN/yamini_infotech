"""
Database Migration: WhatsApp Notification System
================================================

This migration adds:
1. WhatsApp message log table for audit
2. Idempotency columns to prevent duplicate messages

Run this script to add WhatsApp notification support.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, SessionLocal
from sqlalchemy import text


def run_migration():
    """Run the WhatsApp notification system migration."""
    
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("WhatsApp Notification System Migration")
        print("=" * 60)
        
        # =====================================================================
        # 1. Create WhatsApp Message Log Table
        # =====================================================================
        print("\n📋 Creating whatsapp_message_logs table...")
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
                id SERIAL PRIMARY KEY,
                event_type VARCHAR(50) NOT NULL,
                customer_phone VARCHAR(20) NOT NULL,
                customer_name VARCHAR(255),
                message_content TEXT NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                reference_type VARCHAR(50),
                reference_id INTEGER,
                error_message TEXT,
                retry_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sent_at TIMESTAMP,
                
                -- Indexes for efficient querying
                CONSTRAINT chk_status CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'RETRYING'))
            )
        """))
        
        # Create indexes
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_event_type 
            ON whatsapp_message_logs(event_type)
        """))
        
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status 
            ON whatsapp_message_logs(status)
        """))
        
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at 
            ON whatsapp_message_logs(created_at DESC)
        """))
        
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_reference 
            ON whatsapp_message_logs(reference_type, reference_id)
        """))
        
        print("✅ whatsapp_message_logs table created")
        
        # =====================================================================
        # 2. Add Idempotency Columns to Enquiries
        # =====================================================================
        print("\n📋 Adding idempotency columns to enquiries table...")
        
        # Check existing columns
        existing_cols = db.execute(text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'enquiries'
        """)).fetchall()
        existing_col_names = [col[0] for col in existing_cols]
        
        if 'whatsapp_enquiry_sent' not in existing_col_names:
            db.execute(text("""
                ALTER TABLE enquiries 
                ADD COLUMN whatsapp_enquiry_sent BOOLEAN DEFAULT FALSE
            """))
            print("  ✅ Added whatsapp_enquiry_sent to enquiries")
        else:
            print("  ⚠️ whatsapp_enquiry_sent already exists in enquiries")
        
        # =====================================================================
        # 3. Add Idempotency Columns to Complaints
        # =====================================================================
        print("\n📋 Adding idempotency columns to complaints table...")
        
        existing_cols = db.execute(text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'complaints'
        """)).fetchall()
        existing_col_names = [col[0] for col in existing_cols]
        
        columns_to_add = [
            ('whatsapp_service_created_sent', 'BOOLEAN DEFAULT FALSE'),
            ('whatsapp_engineer_assigned_sent', 'BOOLEAN DEFAULT FALSE'),
            ('whatsapp_service_completed_sent', 'BOOLEAN DEFAULT FALSE'),
        ]
        
        for col_name, col_type in columns_to_add:
            if col_name not in existing_col_names:
                db.execute(text(f"""
                    ALTER TABLE complaints 
                    ADD COLUMN {col_name} {col_type}
                """))
                print(f"  ✅ Added {col_name} to complaints")
            else:
                print(f"  ⚠️ {col_name} already exists in complaints")
        
        # =====================================================================
        # 4. Add Idempotency Columns to Stock Movements
        # =====================================================================
        print("\n📋 Adding idempotency columns to stock_movements table...")
        
        existing_cols = db.execute(text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'stock_movements'
        """)).fetchall()
        existing_col_names = [col[0] for col in existing_cols]
        
        columns_to_add = [
            ('whatsapp_delivery_failed_sent', 'BOOLEAN DEFAULT FALSE'),
            ('whatsapp_delivery_reattempt_sent', 'BOOLEAN DEFAULT FALSE'),
            ('delivery_status', 'VARCHAR(20) DEFAULT NULL'),  # DELIVERED, FAILED, REATTEMPT
        ]
        
        for col_name, col_type in columns_to_add:
            if col_name not in existing_col_names:
                db.execute(text(f"""
                    ALTER TABLE stock_movements 
                    ADD COLUMN {col_name} {col_type}
                """))
                print(f"  ✅ Added {col_name} to stock_movements")
            else:
                print(f"  ⚠️ {col_name} already exists in stock_movements")
        
        # =====================================================================
        # 5. Add Idempotency Columns to Bookings (if exists)
        # =====================================================================
        print("\n📋 Checking bookings table...")
        
        table_exists = db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'bookings'
            )
        """)).scalar()
        
        if table_exists:
            existing_cols = db.execute(text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'bookings'
            """)).fetchall()
            existing_col_names = [col[0] for col in existing_cols]
            
            if 'whatsapp_booking_sent' not in existing_col_names:
                db.execute(text("""
                    ALTER TABLE bookings 
                    ADD COLUMN whatsapp_booking_sent BOOLEAN DEFAULT FALSE
                """))
                print("  ✅ Added whatsapp_booking_sent to bookings")
            else:
                print("  ⚠️ whatsapp_booking_sent already exists in bookings")
        else:
            print("  ⚠️ bookings table does not exist")
        
        # Commit all changes
        db.commit()
        
        print("\n" + "=" * 60)
        print("✅ WhatsApp Notification System Migration Complete!")
        print("=" * 60)
        
        # Print summary
        print("""
📋 Summary:
   - whatsapp_message_logs table created (audit log)
   - enquiries.whatsapp_enquiry_sent column added
   - complaints.whatsapp_service_created_sent column added
   - complaints.whatsapp_engineer_assigned_sent column added
   - complaints.whatsapp_service_completed_sent column added
   - stock_movements.whatsapp_delivery_failed_sent column added
   - stock_movements.whatsapp_delivery_reattempt_sent column added
   - stock_movements.delivery_status column added

🔧 Next Steps:
   1. Install PyWhatKit: pip install pywhatkit
   2. Ensure WhatsApp Web is logged in on the server
   3. Restart the backend server
        """)
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        db.close()


def rollback_migration():
    """Rollback the WhatsApp notification system migration."""
    
    db = SessionLocal()
    
    try:
        print("Rolling back WhatsApp notification migration...")
        
        # Drop the message log table
        db.execute(text("DROP TABLE IF EXISTS whatsapp_message_logs"))
        
        # Remove columns (PostgreSQL specific)
        db.execute(text("""
            ALTER TABLE enquiries 
            DROP COLUMN IF EXISTS whatsapp_enquiry_sent
        """))
        
        db.execute(text("""
            ALTER TABLE complaints 
            DROP COLUMN IF EXISTS whatsapp_service_created_sent,
            DROP COLUMN IF EXISTS whatsapp_engineer_assigned_sent,
            DROP COLUMN IF EXISTS whatsapp_service_completed_sent
        """))
        
        db.execute(text("""
            ALTER TABLE stock_movements 
            DROP COLUMN IF EXISTS whatsapp_delivery_failed_sent,
            DROP COLUMN IF EXISTS whatsapp_delivery_reattempt_sent,
            DROP COLUMN IF EXISTS delivery_status
        """))
        
        db.execute(text("""
            ALTER TABLE bookings 
            DROP COLUMN IF EXISTS whatsapp_booking_sent
        """))
        
        db.commit()
        print("✅ Rollback complete")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Rollback failed: {e}")
        
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "rollback":
        rollback_migration()
    else:
        run_migration()
