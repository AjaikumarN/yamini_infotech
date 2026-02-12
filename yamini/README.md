# Company Website (React + FastAPI)

Modern business management system for Yamini Infotech with PostgreSQL database.

## Tech Stack

### Frontend
- React 18 + Vite
- React Router v6
- Context API (Auth & Notifications)
- React Icons

### Backend
- FastAPI
- SQLAlchemy ORM
- PostgreSQL
- JWT Authentication
- Bcrypt password hashing

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 12+

### Database Setup

1. **Install PostgreSQL** (if not already installed)
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15
   
   # Ubuntu/Debian
   sudo apt install postgresql
   sudo systemctl start postgresql
   ```

2. **Create Database**
   ```bash
   psql -U postgres -c "CREATE DATABASE yamini_infotech;"
   ```

### Backend Setup

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env and update your database credentials
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/yamini_infotech

# Install dependencies
pip install -r requirements.txt

# Initialize database (creates tables and seeds demo data if empty)
python init_db.py

# Start server
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Access Points

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

## Initial Demo Accounts

If your database is empty, `init_db.py` will create demo accounts:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin (Full Access) |
| reception | reception123 | Reception (CRM) |
| salesman | sales123 | Salesman |
| engineer | engineer123 | Service Engineer |
| office | office123 | Office Staff |
| customer | customer123 | Customer |

**⚠️ Important:** Change these passwords after first login in production!

## Documentation

- **Quick Start Guide:** [QUICK_START.md](QUICK_START.md)
- **PostgreSQL Setup:** [POSTGRESQL_SETUP.md](POSTGRESQL_SETUP.md)
- **Backend API:** [backend/README.md](backend/README.md)
- **Integration Status:** [INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md)

## Features

✅ JWT-based authentication
✅ Role-based access control (6 roles)
✅ Customer management
✅ Sales tracking & targets
✅ Service complaint management
✅ GPS-based attendance
✅ MIF (Machine in Field) with audit logging
✅ Real-time notifications
✅ SLA management
✅ PostgreSQL database

## Project Structure

```
├── backend/
│   ├── main.py              # FastAPI app
│   ├── models.py            # Database models
│   ├── schemas.py           # Pydantic schemas
│   ├── database.py          # PostgreSQL connection
│   ├── auth.py              # JWT & permissions
│   ├── crud.py              # Database operations
│   ├── init_db.py           # Database initialization
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment template
│   └── routers/             # API endpoints
│
└── frontend/
    ├── src/
    │   ├── components/      # React components
    │   ├── contexts/        # Auth & Notifications
    │   ├── utils/           # API client
    │   └── styles.css       # Global styles
    └── package.json         # Node dependencies
```

## Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/yamini_infotech
SECRET_KEY=your-secret-key-change-in-production
```

## Development

Backend runs on port 8000, frontend on port 5173 (Vite default).

CORS is configured to allow requests from frontend dev server.

## Production Deployment

1. Update `DATABASE_URL` with production database
2. Change `SECRET_KEY` to a secure random string
3. Update CORS origins in `backend/main.py`
4. Build frontend: `npm run build`
5. Use production WSGI server (gunicorn, uvicorn workers)
6. Set up PostgreSQL backups
7. Enable SSL/TLS for database connections

## Troubleshooting

See [POSTGRESQL_SETUP.md](POSTGRESQL_SETUP.md) for detailed troubleshooting guide.

Common issues:
- **Cannot connect to database:** Check PostgreSQL is running
- **Database does not exist:** Create it with `psql -U postgres -c "CREATE DATABASE yamini_infotech;"`
- **Authentication failed:** Update password in `.env` file
- **Demo data not seeding:** Database must be completely empty

## License

Proprietary - Yamini Infotech © 2025
