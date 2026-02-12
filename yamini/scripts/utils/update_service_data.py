"""
Update existing service request with email and company
"""
from sqlalchemy import create_engine, text
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/yamini_infotech"
)

engine = create_engine(DATABASE_URL)

def update_service():
    try:
        with engine.connect() as conn:
            # Update the alanajai service request
            result = conn.execute(text("""
                UPDATE complaints 
                SET email = 'alanajai@example.com',
                    company = 'Alanajai Tech Solutions'
                WHERE customer_name = 'alanajai'
                RETURNING id, customer_name, email, company
            """))
            
            updated = result.fetchone()
            conn.commit()
            
            if updated:
                print(f"✅ Updated service request:")
                print(f"   ID: {updated[0]}")
                print(f"   Name: {updated[1]}")
                print(f"   Email: {updated[2]}")
                print(f"   Company: {updated[3]}")
            else:
                print("No records found to update")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    update_service()
