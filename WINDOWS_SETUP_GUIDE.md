# 🖥️ Windows Setup Guide - Yamini Infotech ERP

This guide covers everything needed to set up the project on a Windows PC.

---

## 📋 Prerequisites

### 1. Install PostgreSQL (Database)
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer, choose:
   - Port: `5432` (default)
   - Password: `postgres` (or your choice)
   - Locale: Default
3. After installation, create the database:
   ```cmd
   psql -U postgres
   CREATE DATABASE yamini_infotech;
   \q
   ```

### 2. Install Python 3.11+
1. Download from: https://www.python.org/downloads/
2. ✅ **IMPORTANT**: Check "Add Python to PATH" during installation
3. Verify: Open CMD and run `python --version`

### 3. Install Node.js 18+
1. Download from: https://nodejs.org/
2. Choose LTS version
3. Verify: `node --version` and `npm --version`

### 4. Install Flutter 3.10+
1. Download from: https://docs.flutter.dev/get-started/install/windows
2. Extract to `C:\flutter`
3. Add to PATH: `C:\flutter\bin`
4. Run `flutter doctor` to verify

### 5. Install Git
1. Download from: https://git-scm.com/download/win
2. Use default settings

---

## 🚀 Backend Setup (Python/FastAPI)

### Step 1: Navigate to backend folder
```cmd
cd C:\path\to\erpee\yamini\backend
```

### Step 2: Create virtual environment
```cmd
python -m venv venv
venv\Scripts\activate
```

### Step 3: Install dependencies
```cmd
pip install -r requirements.txt
```

### Step 4: Configure environment
Create `.env` file (or copy from `.env.example`):
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/yamini_infotech

# JWT Secret Key
SECRET_KEY=yamini_infotech_secret_key_2025

# Server Configuration
HOST=0.0.0.0
PORT=8000

# Brevo SMTP (for email reports)
BREVO_SMTP_USERNAME=your_smtp_username
BREVO_SMTP_PASSWORD=your_smtp_password
ADMIN_EMAIL=your_admin_email@example.com

# Frontend URL (for CORS and links)
FRONTEND_URL=http://localhost:5173
```

### Step 5: Initialize database
The database tables are created automatically on first run.

### Step 6: Run the backend
```cmd
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Access API docs at: http://localhost:8000/docs

---

## 💻 Frontend Setup (React/Vite)

### Step 1: Navigate to frontend folder
```cmd
cd C:\path\to\erpee\yamini\frontend
```

### Step 2: Install dependencies
```cmd
npm install
```

### Step 3: Run development server
```cmd
npm run dev
```

Access at: http://localhost:5173

---

## 📱 Flutter App Setup (Staff App)

### Step 1: Navigate to Flutter project
```cmd
cd C:\path\to\erpee\staff_app\flutter_application_1
```

### Step 2: Get dependencies
```cmd
flutter pub get
```

### Step 3: Update API URL for Windows
Edit `lib/core/constants/api_constants.dart`:
- For Android Emulator: Use `10.0.2.2:8000`
- For physical device on same network: Use your PC's IP address (e.g., `192.168.1.100:8000`)

### Step 4: Run the app
```cmd
flutter run
```

---

## 🔧 Windows-Specific Configurations

### Firewall Settings
If devices can't connect to the backend:
1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Add Python and allow port 8000

### Find Your PC's IP Address
```cmd
ipconfig
```
Look for "IPv4 Address" under your network adapter.

### Running as Background Service
To run backend as a Windows service, use NSSM:
1. Download NSSM: https://nssm.cc/download
2. Install service:
   ```cmd
   nssm install YaminiERP "C:\path\to\venv\Scripts\uvicorn.exe" "main:app --host 0.0.0.0 --port 8000"
   ```

---

## 📝 Common Issues & Solutions

### Issue: "psycopg2 installation fails"
Solution: Install pre-built binary:
```cmd
pip install psycopg2-binary
```

### Issue: "Module not found"
Solution: Ensure virtual environment is activated:
```cmd
venv\Scripts\activate
```

### Issue: "Port 8000 already in use"
Solution: Find and kill the process:
```cmd
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Issue: Flutter device not detected
Solution: Enable USB debugging and run:
```cmd
flutter doctor
adb devices
```

### Issue: CORS errors in browser
Solution: Ensure backend is running and frontend URL is in CORS origins (check main.py).

---

## 🗄️ Database Migration (If moving existing data)

### Export from Mac:
```bash
pg_dump -U postgres -d yamini_infotech > backup.sql
```

### Import on Windows:
```cmd
psql -U postgres -d yamini_infotech < backup.sql
```

---

## 📁 Project Structure Overview

```
erpee/
├── yamini/
│   ├── backend/           # FastAPI Python backend
│   │   ├── main.py        # Entry point
│   │   ├── database.py    # DB connection
│   │   ├── models.py      # SQLAlchemy models
│   │   ├── routers/       # API endpoints
│   │   ├── services/      # Business logic
│   │   └── requirements.txt
│   └── frontend/          # React Vite frontend
│       ├── src/
│       └── package.json
├── staff_app/
│   └── flutter_application_1/  # Flutter mobile app
│       ├── lib/
│       └── pubspec.yaml
└── WINDOWS_SETUP_GUIDE.md
```

---

## ✅ Quick Start Commands (Windows)

```cmd
# Terminal 1: Backend
cd yamini\backend
venv\Scripts\activate
uvicorn main:app --reload

# Terminal 2: Frontend
cd yamini\frontend
npm run dev

# Terminal 3: Flutter (optional)
cd staff_app\flutter_application_1
flutter run
```

---

## 🆘 Support

For issues specific to this project, check the README files in each folder:
- Backend: `yamini/backend/README.md`
- Frontend: `yamini/frontend/ARCHITECTURE.md`
- Flutter: `staff_app/flutter_application_1/README.md`
