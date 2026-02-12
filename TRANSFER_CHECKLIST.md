# 📦 Files to Transfer to Windows PC

## ✅ Copy These Files/Folders

```
erpee/
├── yamini/
│   ├── backend/           ← COPY (except venv/, __pycache__/, .env)
│   └── frontend/          ← COPY (except node_modules/, dist/)
├── staff_app/             ← COPY (except build/, .dart_tool/)
├── WINDOWS_SETUP_GUIDE.md ← COPY
├── start_all.bat          ← COPY
└── *.md (documentation)   ← COPY
```

## ❌ DO NOT Copy (Will be regenerated)

- `yamini/backend/venv/` - Virtual environment (regenerate with setup script)
- `yamini/backend/__pycache__/` - Python cache
- `yamini/backend/*.db` - Local SQLite databases (if any)
- `yamini/backend/.env` - Contains secrets (recreate from .env.example)
- `yamini/frontend/node_modules/` - NPM packages (regenerate with npm install)
- `yamini/frontend/dist/` - Build output
- `staff_app/flutter_application_1/build/` - Flutter build files
- `.dart_tool/` - Dart tools cache

## 📋 Post-Transfer Checklist

### 1. Backend Setup
```cmd
cd yamini\backend
setup_windows.bat
```

### 2. Configure Database
- Install PostgreSQL 15+
- Create database: `yamini_infotech`
- Update `.env` with correct credentials

### 3. Configure Environment
Edit `yamini\backend\.env`:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/yamini_infotech
SECRET_KEY=your_secure_key_here
```

### 4. Frontend Setup
```cmd
cd yamini\frontend
npm install
```

### 5. Flutter Setup
```cmd
cd staff_app\flutter_application_1
flutter pub get
```

### 6. Update API URLs (if needed)
- Backend: Edit `yamini\backend\.env`
- Frontend: Edit `yamini\frontend\.env`
- Flutter: Edit `staff_app\flutter_application_1\lib\core\constants\api_constants.dart`

## 🔐 Database Migration (Optional)

### Export from current machine:
```bash
pg_dump -U postgres -d yamini_infotech > yamini_backup.sql
```

### Import on Windows:
```cmd
psql -U postgres -d yamini_infotech < yamini_backup.sql
```

## 🚀 Quick Start on Windows

After setup, just run:
```cmd
start_all.bat
```

Or start individually:
```cmd
# Terminal 1
cd yamini\backend
start_backend.bat

# Terminal 2
cd yamini\frontend
start_frontend.bat
```

## 📱 Mobile App Testing

For Flutter app on physical device:
1. Find Windows PC IP: `ipconfig` → IPv4 Address
2. Update `api_constants.dart` with: `http://YOUR_IP:8000`
3. Connect device to same WiFi network
4. Run: `flutter run`

---

**Documentation**: See `WINDOWS_SETUP_GUIDE.md` for detailed instructions.
