"""
Database Migration: Salesman Portal Enhancements
Adds missing columns for voice-to-text, GPS tracking, and enhanced workflow
"""

from sqlalchemy import create_engine, text, inspect
from database import DATABASE_URL, engine as db_engine
import sys

def run_migration():
    engine = db_engine
    inspector = inspect(engine)
    
    migrations = []
    
    # Check existing columns before adding
    def column_exists(table_name, column_name):
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        return column_name in columns
    
    print("🔍 Checking database structure...")
    
    # ===== ATTENDANCE TABLE =====
    print("\n📋 Checking attendance table...")
    if not column_exists('attendance', 'check_in_time'):
        migrations.append("ALTER TABLE attendance ADD COLUMN check_in_time VARCHAR")
        print("  ➕ Will add: check_in_time")
    
    if not column_exists('attendance', 'check_in_lat'):
        migrations.append("ALTER TABLE attendance ADD COLUMN check_in_lat FLOAT")
        print("  ➕ Will add: check_in_lat")
    
    if not column_exists('attendance', 'check_in_lng'):
        migrations.append("ALTER TABLE attendance ADD COLUMN check_in_lng FLOAT")
        print("  ➕ Will add: check_in_lng")
    
    if not column_exists('attendance', 'photo_url'):
        migrations.append("ALTER TABLE attendance ADD COLUMN photo_url VARCHAR")
        print("  ➕ Will add: photo_url")
    
    # Note: 'status' column already exists
    
    # ===== ENQUIRIES TABLE =====
    print("\n📋 Checking enquiries table...")
    # Note: 'source' column already exists
    
    if not column_exists('enquiries', 'last_followup_at'):
        migrations.append("ALTER TABLE enquiries ADD COLUMN last_followup_at TIMESTAMP")
        print("  ➕ Will add: last_followup_at")
    
    if not column_exists('enquiries', 'converted_to_order'):
        migrations.append("ALTER TABLE enquiries ADD COLUMN converted_to_order BOOLEAN DEFAULT FALSE")
        print("  ➕ Will add: converted_to_order")
    
    if not column_exists('enquiries', 'order_id'):
        migrations.append("ALTER TABLE enquiries ADD COLUMN order_id INTEGER")
        print("  ➕ Will add: order_id (foreign key to orders)")
    
    # ===== SALES_CALLS TABLE =====
    print("\n📋 Checking sales_calls table...")
    if not column_exists('sales_calls', 'call_outcome'):
        migrations.append("ALTER TABLE sales_calls ADD COLUMN call_outcome VARCHAR")
        print("  ➕ Will add: call_outcome")
    
    if not column_exists('sales_calls', 'next_action_date'):
        migrations.append("ALTER TABLE sales_calls ADD COLUMN next_action_date TIMESTAMP")
        print("  ➕ Will add: next_action_date")
    
    if not column_exists('sales_calls', 'voice_note_text'):
        migrations.append("ALTER TABLE sales_calls ADD COLUMN voice_note_text TEXT")
        print("  ➕ Will add: voice_note_text")
    
    if not column_exists('sales_calls', 'enquiry_id'):
        migrations.append("ALTER TABLE sales_calls ADD COLUMN enquiry_id INTEGER")
        print("  ➕ Will add: enquiry_id (link to enquiry)")
    
    # ===== SHOP_VISITS TABLE =====
    print("\n📋 Checking shop_visits table...")
    if not column_exists('shop_visits', 'gps_lat'):
        migrations.append("ALTER TABLE shop_visits ADD COLUMN gps_lat FLOAT")
        print("  ➕ Will add: gps_lat")
    
    if not column_exists('shop_visits', 'gps_lng'):
        migrations.append("ALTER TABLE shop_visits ADD COLUMN gps_lng FLOAT")
        print("  ➕ Will add: gps_lng")
    
    if not column_exists('shop_visits', 'photo_url'):
        migrations.append("ALTER TABLE shop_visits ADD COLUMN photo_url VARCHAR")
        print("  ➕ Will add: photo_url")
    
    if not column_exists('shop_visits', 'voice_note_text'):
        migrations.append("ALTER TABLE shop_visits ADD COLUMN voice_note_text TEXT")
        print("  ➕ Will add: voice_note_text")
    
    if not column_exists('shop_visits', 'enquiry_id'):
        migrations.append("ALTER TABLE shop_visits ADD COLUMN enquiry_id INTEGER")
        print("  ➕ Will add: enquiry_id (link to enquiry)")
    
    # ===== DAILY_REPORTS TABLE =====
    print("\n📋 Checking daily_reports table...")
    if not column_exists('daily_reports', 'voice_note_text'):
        migrations.append("ALTER TABLE daily_reports ADD COLUMN voice_note_text TEXT")
        print("  ➕ Will add: voice_note_text")
    
    if not column_exists('daily_reports', 'total_distance_km'):
        migrations.append("ALTER TABLE daily_reports ADD COLUMN total_distance_km FLOAT DEFAULT 0")
        print("  ➕ Will add: total_distance_km")
    
    if not column_exists('daily_reports', 'work_start_time'):
        migrations.append("ALTER TABLE daily_reports ADD COLUMN work_start_time TIMESTAMP")
        print("  ➕ Will add: work_start_time")
    
    if not column_exists('daily_reports', 'work_end_time'):
        migrations.append("ALTER TABLE daily_reports ADD COLUMN work_end_time TIMESTAMP")
        print("  ➕ Will add: work_end_time")
    
    # ===== SALES_FOLLOWUPS TABLE =====
    print("\n📋 Checking sales_followups table...")
    if not column_exists('sales_followups', 'voice_note_text'):
        migrations.append("ALTER TABLE sales_followups ADD COLUMN voice_note_text TEXT")
        print("  ➕ Will add: voice_note_text")
    
    if not column_exists('sales_followups', 'outcome'):
        migrations.append("ALTER TABLE sales_followups ADD COLUMN outcome VARCHAR")
        print("  ➕ Will add: outcome")
    
    # Execute migrations
    if not migrations:
        print("\n✅ All columns already exist! Database is up to date.")
        return
    
    print(f"\n🔧 Applying {len(migrations)} migrations...")
    
    with engine.connect() as conn:
        for i, migration in enumerate(migrations, 1):
            try:
                print(f"  [{i}/{len(migrations)}] {migration[:60]}...")
                conn.execute(text(migration))
                conn.commit()
                print(f"  ✅ Success")
            except Exception as e:
                print(f"  ⚠️  Warning: {str(e)}")
                conn.rollback()
    
    print("\n🎉 Migration completed!")
    print("\n📌 Next steps:")
    print("  1. Update backend/models.py to add new columns")
    print("  2. Update backend/schemas.py for new fields")
    print("  3. Add voice-to-text frontend components")
    print("  4. Test attendance lock at 9:30 AM")

if __name__ == "__main__":
    try:
        run_migration()
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)
