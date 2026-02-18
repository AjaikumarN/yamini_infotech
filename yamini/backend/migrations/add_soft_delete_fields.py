"""
Migration: Add soft-delete and visibility tracking fields
Date: 2026-02-18

Adds:
- is_deleted (BOOLEAN DEFAULT false) - Soft delete flag
- is_viewed (BOOLEAN DEFAULT false) - Visibility tracking for badge counters
- created_by_role (VARCHAR) - Role of the creator
- assigned_role (VARCHAR) - Target role for assignment

Tables affected:
- enquiries
- complaints
- orders
- visitors
- daily_reports
- stock_movements
- outstanding
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection - use same config as main app
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/yamini_infotech"
)
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


def add_column_if_not_exists(db, table_name, column_name, column_type, default=None):
    """Helper to add column if it doesn't exist"""
    result = db.execute(text(f"""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '{table_name}' AND column_name = '{column_name}'
    """)).fetchone()
    
    if not result:
        default_clause = f" DEFAULT {default}" if default is not None else ""
        db.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}{default_clause}"))
        print(f"✅ Added '{column_name}' to '{table_name}'")
        return True
    else:
        print(f"⏭️  '{column_name}' already exists in '{table_name}'")
        return False


def run_migration():
    """Run the migration to add soft-delete and visibility fields"""
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("MIGRATION: Soft-Delete and Visibility Tracking Fields")
        print("=" * 60)
        
        # ============ ENQUIRIES TABLE ============
        print("\n📋 ENQUIRIES TABLE:")
        add_column_if_not_exists(db, 'enquiries', 'is_deleted', 'BOOLEAN', 'false')
        add_column_if_not_exists(db, 'enquiries', 'is_viewed', 'BOOLEAN', 'false')
        add_column_if_not_exists(db, 'enquiries', 'created_by_role', 'VARCHAR(50)', None)
        add_column_if_not_exists(db, 'enquiries', 'assigned_role', 'VARCHAR(50)', None)
        
        # Create indexes for performance
        try:
            db.execute(text("CREATE INDEX IF NOT EXISTS idx_enquiries_is_deleted ON enquiries(is_deleted)"))
            db.execute(text("CREATE INDEX IF NOT EXISTS idx_enquiries_is_viewed ON enquiries(is_viewed)"))
            print("✅ Created indexes for enquiries")
        except Exception as e:
            print(f"⚠️  Index creation for enquiries: {e}")
        
        # ============ COMPLAINTS TABLE ============
        print("\n🔧 COMPLAINTS TABLE:")
        add_column_if_not_exists(db, 'complaints', 'is_deleted', 'BOOLEAN', 'false')
        add_column_if_not_exists(db, 'complaints', 'is_viewed', 'BOOLEAN', 'false')
        add_column_if_not_exists(db, 'complaints', 'created_by_role', 'VARCHAR(50)', None)
        
        try:
            db.execute(text("CREATE INDEX IF NOT EXISTS idx_complaints_is_deleted ON complaints(is_deleted)"))
            db.execute(text("CREATE INDEX IF NOT EXISTS idx_complaints_is_viewed ON complaints(is_viewed)"))
            print("✅ Created indexes for complaints")
        except Exception as e:
            print(f"⚠️  Index creation for complaints: {e}")
        
        # ============ ORDERS TABLE ============
        print("\n📦 ORDERS TABLE:")
        add_column_if_not_exists(db, 'orders', 'is_deleted', 'BOOLEAN', 'false')
        add_column_if_not_exists(db, 'orders', 'is_viewed', 'BOOLEAN', 'false')
        
        try:
            db.execute(text("CREATE INDEX IF NOT EXISTS idx_orders_is_deleted ON orders(is_deleted)"))
            db.execute(text("CREATE INDEX IF NOT EXISTS idx_orders_is_viewed ON orders(is_viewed)"))
            print("✅ Created indexes for orders")
        except Exception as e:
            print(f"⚠️  Index creation for orders: {e}")
        
        # ============ VISITORS TABLE ============
        print("\n👥 VISITORS TABLE:")
        add_column_if_not_exists(db, 'visitors', 'is_deleted', 'BOOLEAN', 'false')
        
        try:
            db.execute(text("CREATE INDEX IF NOT EXISTS idx_visitors_is_deleted ON visitors(is_deleted)"))
            print("✅ Created index for visitors")
        except Exception as e:
            print(f"⚠️  Index creation for visitors: {e}")
        
        # ============ DAILY_REPORTS TABLE ============
        print("\n📊 DAILY_REPORTS TABLE:")
        add_column_if_not_exists(db, 'daily_reports', 'is_deleted', 'BOOLEAN', 'false')
        
        try:
            db.execute(text("CREATE INDEX IF NOT EXISTS idx_daily_reports_is_deleted ON daily_reports(is_deleted)"))
            print("✅ Created index for daily_reports")
        except Exception as e:
            print(f"⚠️  Index creation for daily_reports: {e}")
        
        # ============ STOCK_MOVEMENTS TABLE ============
        print("\n📦 STOCK_MOVEMENTS TABLE:")
        add_column_if_not_exists(db, 'stock_movements', 'is_deleted', 'BOOLEAN', 'false')
        
        try:
            db.execute(text("CREATE INDEX IF NOT EXISTS idx_stock_movements_is_deleted ON stock_movements(is_deleted)"))
            print("✅ Created index for stock_movements")
        except Exception as e:
            print(f"⚠️  Index creation for stock_movements: {e}")
        
        # ============ OUTSTANDING TABLE ============
        print("\n💰 OUTSTANDING TABLE:")
        add_column_if_not_exists(db, 'outstanding', 'is_deleted', 'BOOLEAN', 'false')
        
        try:
            db.execute(text("CREATE INDEX IF NOT EXISTS idx_outstanding_is_deleted ON outstanding(is_deleted)"))
            print("✅ Created index for outstanding")
        except Exception as e:
            print(f"⚠️  Index creation for outstanding: {e}")
        
        db.commit()
        print("\n" + "=" * 60)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY")
        print("=" * 60)
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ MIGRATION FAILED: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_migration()
