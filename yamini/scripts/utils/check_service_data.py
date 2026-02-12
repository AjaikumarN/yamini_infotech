"""
Check customer and service request data
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/yamini_infotech"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_data():
    db = SessionLocal()
    try:
        # Check service requests with customer details
        print("\n📋 Service Requests with Customer Details:")
        print("-" * 100)
        result = db.execute(text("""
            SELECT 
                c.id,
                c.ticket_no,
                c.customer_id,
                c.customer_name,
                c.phone,
                c.assigned_to,
                cust.email,
                cust.company
            FROM complaints c
            LEFT JOIN customers cust ON c.customer_id = cust.id
            WHERE c.assigned_to IS NOT NULL
            ORDER BY c.created_at DESC
            LIMIT 5
        """))
        
        for row in result:
            print(f"ID: {row[0]} | Ticket: {row[1]} | CustID: {row[2]} | Name: {row[3]}")
            print(f"  Phone: {row[4]} | Email: {row[6]} | Company: {row[7]}")
            print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_data()
