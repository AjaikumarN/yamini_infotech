# Quick Start Guide - PostgreSQL Integration

## ✅ What Changed

1. **Removed SQLite** → Now using **PostgreSQL**
2. **Removed hardcoded demo accounts** from frontend
3. **Database auto-seeding** - Demo data is only created if database is empty
4. **Environment-based configuration** - Database credentials in `.env` file

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Ensure PostgreSQL is Running

```bash
# macOS
brew services start postgresql@15

# Ubuntu/Linux
sudo systemctl start postgresql

# Check if running
psql -U postgres -c "SELECT version();"
```

### Step 2: Create Database

```bash
psql -U postgres -c "CREATE DATABASE yamini_infotech;"
```

### Step 3: Configure Environment

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env and update your database credentials
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/yamini_infotech
nano .env
```

### Step 4: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 5: Initialize Database

```bash
python init_db.py
```

**Output will show:**
- ✅ Tables created
- ✅ Database checked
- If empty: Seeds demo data and displays login credentials
- If has data: Skips seeding and shows current data count

---

## 🔐 Demo Accounts

Demo accounts are **only created if your database is empty** when you run `init_db.py`:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| reception | reception123 | Reception |
| salesman | sales123 | Salesman |
| engineer | engineer123 | Service Engineer |
| office | office123 | Office Staff |
| customer | customer123 | Customer |

**⚠️ Important:** These are created only once during initial setup. Change passwords after first login!

---

## 🏃 Running the Application

### Start Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### Start Frontend
```bash
cd frontend
npm install  # First time only
npm run dev
```

Access:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## 🔍 Verify Database

```bash
# Connect to database
psql -U postgres -d yamini_infotech

# List tables
\dt

# View users
SELECT username, role, email FROM users;

# View customers
SELECT customer_id, name, email FROM customers;

# Exit
\q
```

---

## 🗄️ Database Schema

The following tables are created:

1. **users** - User accounts with roles
2. **customers** - Customer records
3. **enquiries** - Sales enquiries
4. **follow_up_history** - Enquiry follow-ups
5. **complaints** - Service complaints
6. **bookings** - Service bookings
7. **sales_calls** - Sales call logs
8. **shop_visits** - Field visit records
9. **attendance** - Employee attendance
10. **mif_records** - Machine in Field (Confidential)
11. **mif_access_logs** - MIF audit trail
12. **products** - Product catalog
13. **services** - Service offerings
14. **reminders** - Automated reminders
15. **notifications** - User notifications

---

## 🔄 Re-seeding Database

If you want to reset and re-seed the database:

```bash
# Method 1: Drop and recreate schema
psql -U postgres yamini_infotech -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
python init_db.py

# Method 2: Drop and recreate database
psql -U postgres -c "DROP DATABASE yamini_infotech;"
psql -U postgres -c "CREATE DATABASE yamini_infotech;"
python init_db.py
```

---

## 🛠️ Troubleshooting

### Cannot connect to PostgreSQL
```bash
# Check if PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Start PostgreSQL
brew services start postgresql@15  # macOS
sudo systemctl start postgresql  # Linux
```

### Database does not exist
```bash
psql -U postgres -c "CREATE DATABASE yamini_infotech;"
```

### Authentication failed
```bash
# Reset postgres password
sudo -u postgres psql
ALTER USER postgres PASSWORD 'newpassword';
\q

# Update .env file with new password
```

### Tables not created
```bash
# Check database connection in .env
# Run init_db.py with verbose output
python init_db.py
```

### Demo data not appearing
- Demo data is only created if database is **completely empty**
- If you have any users, it skips seeding
- To force re-seed, drop all data first (see Re-seeding section)

---

## 📝 Environment Variables

Edit `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Example for local PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/yamini_infotech

# Example for remote PostgreSQL
DATABASE_URL=postgresql://user:pass@db.example.com:5432/yamini_infotech

# JWT Secret (change in production!)
SECRET_KEY=yamini_infotech_secret_key_2025
```

---

## ✅ What's Different from Before

### Before (SQLite + Hardcoded Users)
- ❌ SQLite database file
- ❌ Demo users hardcoded in frontend
- ❌ Always seeded data on init
- ❌ Quick login buttons with passwords

### After (PostgreSQL + Dynamic)
- ✅ PostgreSQL production database
- ✅ Real database authentication
- ✅ Seeds only if database is empty
- ✅ Clean login form without shortcuts
- ✅ Environment-based configuration
- ✅ Production-ready setup

---

## 🎯 Next Steps

1. **Change demo passwords** after first login
2. **Backup your database** regularly
3. **Configure production environment** variables
4. **Set up SSL/TLS** for database connections
5. **Enable database backups** (pg_dump)
6. **Monitor database performance**

---

## 📚 Additional Resources

- **PostgreSQL Setup Guide:** See `POSTGRESQL_SETUP.md`
- **Backend README:** See `backend/README.md`
- **API Documentation:** http://localhost:8000/docs (when server is running)

---

## 🆘 Need Help?

If you encounter issues:
1. Check PostgreSQL is running
2. Verify database exists
3. Check `.env` file has correct credentials
4. Review error messages from `init_db.py`
5. Check `POSTGRESQL_SETUP.md` for detailed troubleshooting
