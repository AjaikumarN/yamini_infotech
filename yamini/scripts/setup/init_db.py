"""
Database initialization script with seed data
Run this once to create tables and populate with demo data if database is empty
"""

from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import crud
import schemas
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def init_db():
    """Initialize database with tables and seed data only if database is empty"""
    
    # Create all tables
    print("Creating database tables...")
    try:
        models.Base.metadata.create_all(bind=engine)
        print("✓ Tables created successfully")
    except Exception as e:
        print(f"✗ Error creating tables: {e}")
        return
    
    db = SessionLocal()
    
    try:
        # Check if database has any users
        existing_users = db.query(models.User).first()
        if existing_users:
            print("\n✓ Database already contains data. Skipping seed data.")
            print(f"  Total users: {db.query(models.User).count()}")
            print(f"  Total customers: {db.query(models.Customer).count()}")
            print(f"  Total products: {db.query(models.Product).count()}")
            return
        
        print("\n⚠️  Database is empty. Seeding with initial demo data...")
        
        # Create users for each role
        users_data = [
            {
                "username": "admin",
                "email": "admin@yamini.com",
                "password": "admin123",
                "full_name": "System Administrator",
                "role": models.UserRole.ADMIN,
                "department": "Administration"
            },
            {
                "username": "reception",
                "email": "reception@yamini.com",
                "password": "reception123",
                "full_name": "Reception Desk",
                "role": models.UserRole.RECEPTION,
                "department": "Front Office"
            },
            {
                "username": "salesman",
                "email": "sales@yamini.com",
                "password": "sales123",
                "full_name": "Sales Representative",
                "role": models.UserRole.SALESMAN,
                "department": "Sales"
            },
            {
                "username": "engineer",
                "email": "engineer@yamini.com",
                "password": "engineer123",
                "full_name": "Service Engineer",
                "role": models.UserRole.SERVICE_ENGINEER,
                "department": "Service"
            },
            {
                "username": "office",
                "email": "office@yamini.com",
                "password": "office123",
                "full_name": "Office Staff",
                "role": models.UserRole.OFFICE_STAFF,
                "department": "Operations"
            },
            {
                "username": "customer",
                "email": "customer@example.com",
                "password": "customer123",
                "full_name": "Demo Customer",
                "role": models.UserRole.CUSTOMER,
                "department": None
            }
        ]
        
        users = {}
        for user_data in users_data:
            user_create = schemas.UserCreate(**user_data)
            user = crud.create_user(db, user_create)
            users[user_data["username"]] = user
            print(f"✓ Created user: {user_data['username']} ({user_data['role'].value})")
        
        # Create sample customers
        customers_data = [
            {
                "name": "ABC Corporation",
                "email": "contact@abc.com",
                "phone": "9876543210",
                "address": "123 Business Park, Chennai",
                "company": "ABC Corporation",
                "amc_status": "Active",
                "amc_expiry": datetime.now() + timedelta(days=180)
            },
            {
                "name": "XYZ Enterprises",
                "email": "info@xyz.com",
                "phone": "9876543211",
                "address": "456 Tech Hub, Bangalore",
                "company": "XYZ Enterprises",
                "amc_status": "Expired",
                "amc_expiry": datetime.now() - timedelta(days=30)
            },
            {
                "name": "Tech Solutions Ltd",
                "email": "hello@techsol.com",
                "phone": "9876543212",
                "address": "789 IT Park, Hyderabad",
                "company": "Tech Solutions Ltd",
                "amc_status": "Active",
                "amc_expiry": datetime.now() + timedelta(days=90)
            }
        ]
        
        customers = []
        for cust_data in customers_data:
            customer = crud.create_customer(db, schemas.CustomerCreate(**cust_data))
            customers.append(customer)
        print(f"✓ Created {len(customers)} sample customers")
        
        # Create sample enquiries
        enquiries_data = [
            {
                "customer_name": "ABC Corporation",
                "contact_number": "9876543210",
                "enquiry_details": "Interested in bulk printer purchase",
                "priority": "HOT",
                "assigned_to": users["salesman"].full_name
            },
            {
                "customer_name": "New Customer",
                "contact_number": "9876543299",
                "enquiry_details": "Need quotation for office printers",
                "priority": "WARM",
                "assigned_to": users["salesman"].full_name
            }
        ]
        
        for enq_data in enquiries_data:
            crud.create_enquiry(db, schemas.EnquiryCreate(**enq_data), created_by="System")
        print(f"✓ Created {len(enquiries_data)} sample enquiries")
        
        # Create sample complaints
        complaints_data = [
            {
                "customer_id": customers[0].id,
                "customer_name": customers[0].name,
                "machine_model": "HP LaserJet Pro M404dn",
                "fault_description": "Paper jam issue",
                "priority": "High",
                "assigned_engineer_id": users["engineer"].id
            },
            {
                "customer_id": customers[1].id,
                "customer_name": customers[1].name,
                "machine_model": "Canon ImageClass MF445dw",
                "fault_description": "Print quality degradation",
                "priority": "Medium",
                "assigned_engineer_id": users["engineer"].id
            }
        ]
        
        for comp_data in complaints_data:
            crud.create_complaint(db, schemas.ComplaintCreate(**comp_data))
        print(f"✓ Created {len(complaints_data)} sample complaints")
        
        # Create sample MIF records
        mif_data = [
            {
                "customer_id": customers[0].id,
                "customer_name": customers[0].name,
                "machine_model": "HP LaserJet Pro M404dn",
                "serial_number": "SGIN123456",
                "installation_date": datetime.now() - timedelta(days=365),
                "location": "Chennai",
                "machine_value": 25000.00,
                "amc_status": "Active",
                "amc_expiry": datetime.now() + timedelta(days=180)
            },
            {
                "customer_id": customers[2].id,
                "customer_name": customers[2].name,
                "machine_model": "Canon ImageClass MF445dw",
                "serial_number": "SGIN789012",
                "installation_date": datetime.now() - timedelta(days=200),
                "location": "Hyderabad",
                "machine_value": 32000.00,
                "amc_status": "Active",
                "amc_expiry": datetime.now() + timedelta(days=90)
            }
        ]
        
        for mif in mif_data:
            crud.create_mif_record(db, schemas.MIFRecordCreate(**mif))
        print(f"✓ Created {len(mif_data)} confidential MIF records")
        
        # Create sample products
        products_data = [
            {
                "name": "HP LaserJet Pro M404dn",
                "category": "Printer",
                "price": 25000.00,
                "stock_quantity": 15,
                "description": "Monochrome laser printer"
            },
            {
                "name": "Canon ImageClass MF445dw",
                "category": "Multifunction Printer",
                "price": 32000.00,
                "stock_quantity": 8,
                "description": "All-in-one printer with wireless"
            },
            {
                "name": "Original HP 83A Toner",
                "category": "Consumable",
                "price": 5500.00,
                "stock_quantity": 50,
                "description": "Black toner cartridge"
            }
        ]
        
        for prod_data in products_data:
            crud.create_product(db, schemas.ProductCreate(**prod_data))
        print(f"✓ Created {len(products_data)} sample products")
        
        # Create sample services
        services_data = [
            {
                "name": "AMC - Basic",
                "service_type": "Maintenance",
                "price": 8000.00,
                "duration": "1 Year",
                "description": "Annual maintenance contract - Basic plan"
            },
            {
                "name": "AMC - Premium",
                "service_type": "Maintenance",
                "price": 15000.00,
                "duration": "1 Year",
                "description": "Annual maintenance contract - Premium plan with priority support"
            },
            {
                "name": "Onsite Repair",
                "service_type": "Service",
                "price": 1500.00,
                "duration": "One-time",
                "description": "One-time onsite repair service"
            }
        ]
        
        for svc_data in services_data:
            crud.create_service(db, schemas.ServiceCreate(**svc_data))
        print(f"✓ Created {len(services_data)} sample services")
        
        db.commit()
        print("\n✓ Database initialization complete!")
        print("\nDemo Login Credentials:")
        print("=" * 50)
        for user_data in users_data:
            print(f"Role: {user_data['role'].value:20} | Username: {user_data['username']:12} | Password: {user_data['password']}")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n✗ Error during initialization: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Initializing Yamini Infotech Database...")
    print("=" * 50)
    init_db()
