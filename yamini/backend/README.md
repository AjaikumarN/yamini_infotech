# Yamini Infotech Backend API

Complete FastAPI backend for the business management system with authentication, authorization, and role-based access control.

## Features

- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control (RBAC)** - 6 roles with granular permissions
- **MIF Confidentiality** - Special access control with mandatory logging
- **Complete CRUD Operations** - For all business modules
- **Auto-generated API Documentation** - Swagger UI at `/docs`
- **PostgreSQL Database** - Production-ready database

## Tech Stack

- FastAPI
- SQLAlchemy ORM
- PostgreSQL
- JWT with bcrypt password hashing
- Pydantic validation

## Setup Instructions

### 1. Prerequisites

- Python 3.10+
- PostgreSQL 12+ installed and running
- Database `yamini_infotech` created in PostgreSQL

### 2. Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE yamini_infotech;

# Exit psql
\q
```

### 3. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` and update your database credentials:

```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/yamini_infotech
```

### 5. Initialize Database

Run the database initialization script to create tables and seed with initial data (only if database is empty):

```bash
python init_db.py
```

This will:
- Create all necessary tables
- Check if database has existing data
- If empty, seed with demo users and sample data
- Display login credentials for demo accounts

### 6. Start the Server

```bash
uvicorn main:app --reload --port 8000
```

Server will start at: `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

## Initial Demo Accounts

After running `init_db.py` on an empty database, the following accounts will be created:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Reception | reception | reception123 |
| Salesman | salesman | sales123 |
| Service Engineer | engineer | engineer123 |
| Office Staff | office | office123 |
| Customer | customer | customer123 |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

### Customers
- `POST /api/customers/` - Create customer
- `GET /api/customers/` - List all customers
- `GET /api/customers/{id}` - Get customer by ID

### Enquiries (Reception)
- `POST /api/enquiries/` - Create enquiry
- `GET /api/enquiries/` - List all enquiries (Reception only)
- `PUT /api/enquiries/{id}` - Update enquiry (Reception only)

### Complaints (Service)
- `POST /api/complaints/` - Create complaint
- `GET /api/complaints/` - List all complaints
- `GET /api/complaints/my-complaints` - Get complaints for current engineer
- `PUT /api/complaints/{id}/status` - Update complaint status

### MIF (Confidential - Admin/Office Staff Only)
- `POST /api/mif/` - Create MIF record
- `GET /api/mif/` - List MIF records (ACCESS LOGGED)
- `GET /api/mif/access-logs` - View MIF access logs (Admin only)

### Sales
- `POST /api/sales/calls` - Create sales call
- `POST /api/sales/visits` - Create shop visit
- `GET /api/sales/my-calls` - Get calls for current salesman
- `POST /api/sales/attendance` - Mark attendance
- `GET /api/sales/my-attendance` - Get attendance records

### Products & Services
- `POST /api/products/` - Create product (Admin/Office Staff)
- `GET /api/products/` - List products
- `POST /api/products/services` - Create service
- `GET /api/products/services` - List services

### Bookings
- `POST /api/bookings/` - Create booking
- `GET /api/bookings/` - List bookings

### Notifications
- `POST /api/notifications/` - Create notification
- `GET /api/notifications/my-notifications` - Get user's notifications
- `PUT /api/notifications/{id}/read` - Mark notification as read

## Authentication Flow

1. **Login**: Send username/password to `/api/auth/login`
2. **Receive Token**: Get JWT access token in response
3. **Use Token**: Include token in Authorization header for all requests:
   ```
   Authorization: Bearer <your_token_here>
   ```
4. **Token Expiry**: Tokens expire after 24 hours

## Permission System

Each role has specific permissions:

- **Admin**: All permissions (god mode)
- **Reception**: Manage enquiries, assign tasks
- **Salesman**: Sales calls, visits, attendance
- **Service Engineer**: Manage assigned complaints
- **Office Staff**: View operations, manage stock, **MIF access**
- **Customer**: View own data, create enquiries/bookings

### MIF Security

MIF (Machine Installation Form) data is **highly confidential**:
- Only accessible to **Admin** and **Office Staff**
- Every access is **automatically logged** with:
  - User ID
  - Timestamp
  - IP address
  - Action performed

## Database Models

### Core Tables
- `users` - User accounts with roles
- `customers` - Customer information
- `enquiries` - Sales enquiries (CRM)
- `followup_history` - Enquiry audit trail
- `complaints` - Service complaints with SLA
- `bookings` - Service bookings
- `mif_records` - **CONFIDENTIAL** machine data
- `mif_access_logs` - Audit trail for MIF access

### Sales Tables
- `sales_calls` - Daily sales call tracking
- `shop_visits` - Shop visit records
- `attendance` - Employee attendance with photo/GPS

### Inventory
- `products` - Product catalog
- `services` - Service offerings

### Notifications
- `reminders` - Scheduled reminders
- `notifications` - In-app notifications

## File Structure

```
backend/
├── main.py              # FastAPI application with all routers
├── database.py          # SQLAlchemy database configuration
├── models.py            # Database models (15 tables)
├── schemas.py           # Pydantic validation schemas
├── auth.py              # JWT authentication & RBAC
├── crud.py              # Database CRUD operations
├── init_db.py           # Database initialization script
├── requirements.txt     # Python dependencies
├── routers/             # API route modules
│   ├── auth_routes.py   # Authentication endpoints
│   ├── customers.py     # Customer endpoints
│   ├── enquiries.py     # Enquiry endpoints
│   ├── complaints.py    # Complaint endpoints
│   ├── mif.py          # MIF endpoints (with access logging)
│   ├── sales.py        # Sales & attendance endpoints
│   ├── products.py     # Product & service endpoints
│   ├── notifications.py # Notification endpoints
│   └── bookings.py     # Booking endpoints
└── yamini_business.db   # SQLite database (auto-created)
```

## Environment Variables (Optional)

Create a `.env` file for production:

```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost/dbname
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

## Security Notes

1. **Change default passwords** before production
2. **Use strong SECRET_KEY** in production
3. **Switch to PostgreSQL** for production
4. **Enable HTTPS** for token security
5. **MIF access logging** is mandatory and cannot be disabled
6. Review MIF access logs regularly: `GET /api/mif/access-logs`

## Testing with Swagger UI

1. Go to `http://localhost:8000/docs`
2. Click "Authorize" button
3. Login using demo credentials
4. Copy the `access_token` from response
5. Paste in Authorization dialog
6. Try protected endpoints

## Next Steps

- Integrate frontend with API (replace mock data)
- Implement file upload for attendance photos
- Add email notification service
- Add WhatsApp integration (Phase 2)
- Deploy to production server

---

**Security First**: MIF data is confidential. Every access is logged.
