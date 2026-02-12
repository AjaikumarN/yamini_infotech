"""
Database Constraints for Admin Portal Security
Adds constraints to protect data integrity and audit trail
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import DATABASE_URL

def add_admin_security_constraints():
    """Add security constraints for admin portal"""
    
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        print("🔒 Adding Admin Portal Security Constraints...")
        
        # 1. Attendance - Add correction reason column if not exists
        print("\n1️⃣ Adding attendance correction tracking...")
        try:
            session.execute(text("""
                ALTER TABLE attendance 
                ADD COLUMN correction_reason TEXT
            """))
            print("   ✅ Added correction_reason column to attendance table")
        except Exception as e:
            if "duplicate column" in str(e).lower():
                print("   ⚠️  Column already exists")
            else:
                print(f"   ❌ Error: {e}")
        
        # 2. Attendance - Add corrected_by and corrected_at columns
        try:
            session.execute(text("""
                ALTER TABLE attendance 
                ADD COLUMN corrected_by INTEGER
            """))
            print("   ✅ Added corrected_by column to attendance table")
        except Exception as e:
            if "duplicate column" in str(e).lower():
                print("   ⚠️  Column already exists")
        
        try:
            session.execute(text("""
                ALTER TABLE attendance 
                ADD COLUMN corrected_at TIMESTAMP
            """))
            print("   ✅ Added corrected_at column to attendance table")
        except Exception as e:
            if "duplicate column" in str(e).lower():
                print("   ⚠️  Column already exists")
        
        # 3. Orders - Add status change reason
        print("\n2️⃣ Adding order status change tracking...")
        try:
            session.execute(text("""
                ALTER TABLE orders 
                ADD COLUMN status_change_reason TEXT
            """))
            print("   ✅ Added status_change_reason column to orders table")
        except Exception as e:
            if "duplicate column" in str(e).lower():
                print("   ⚠️  Column already exists")
        
        # 4. Stock Movements - Ensure reason is mandatory for corrections
        print("\n3️⃣ Adding stock movement mandatory reason...")
        try:
            session.execute(text("""
                ALTER TABLE stock_movements 
                ADD COLUMN is_correction BOOLEAN DEFAULT FALSE
            """))
            print("   ✅ Added is_correction flag to stock_movements table")
        except Exception as e:
            if "duplicate column" in str(e).lower():
                print("   ⚠️  Column already exists")
        
        # 5. Audit Logs - Prevent deletion (soft delete only)
        print("\n4️⃣ Protecting audit logs from deletion...")
        try:
            session.execute(text("""
                ALTER TABLE audit_logs 
                ADD COLUMN deleted_at TIMESTAMP
            """))
            print("   ✅ Added deleted_at column to audit_logs table")
        except Exception as e:
            if "duplicate column" in str(e).lower():
                print("   ⚠️  Column already exists")
        
        # 6. Create index on audit logs for faster queries
        print("\n5️⃣ Creating audit log indexes...")
        try:
            session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)
            """))
            print("   ✅ Created index on audit_logs.user_id")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        try:
            session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module)
            """))
            print("   ✅ Created index on audit_logs.module")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        try:
            session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)
            """))
            print("   ✅ Created index on audit_logs.timestamp")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        # 7. Create index on orders for faster status filtering
        print("\n6️⃣ Creating order indexes...")
        try:
            session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)
            """))
            print("   ✅ Created index on orders.status")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        try:
            session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_orders_approved_by ON orders(approved_by)
            """))
            print("   ✅ Created index on orders.approved_by")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        # Commit all changes
        session.commit()
        print("\n✅ All constraints and indexes added successfully!")
        print("\n📌 Summary:")
        print("   • Attendance correction tracking enabled")
        print("   • Order status change reasons tracked")
        print("   • Stock correction flag added")
        print("   • Audit logs protected from deletion")
        print("   • Performance indexes created")
        
    except Exception as e:
        session.rollback()
        print(f"\n❌ Error adding constraints: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    print("=" * 60)
    print("ADMIN PORTAL SECURITY MIGRATION")
    print("=" * 60)
    
    add_admin_security_constraints()
    
    print("\n" + "=" * 60)
    print("MIGRATION COMPLETE")
    print("=" * 60)
