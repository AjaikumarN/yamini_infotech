# Yamini Infotech ERP System

<p align="center">
  <img src="staff_app/flutter_application_1/assets/images/mainlogobgre.png" alt="Yamini Infotech Logo" width="150"/>
</p>

<p align="center">
  <strong>Empowering Business Solutions</strong>
</p>

<p align="center">
  A comprehensive Enterprise Resource Planning system with Web Portal, Mobile App, and Backend API.
</p>

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        YAMINI INFOTECH ERP                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │   Web App   │    │ Mobile App  │    │   Backend   │        │
│   │   (React)   │    │  (Flutter)  │    │  (FastAPI)  │        │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘        │
│          │                  │                  │                │
│          └──────────────────┼──────────────────┘                │
│                             │                                   │
│                    ┌────────▼────────┐                         │
│                    │   PostgreSQL    │                         │
│                    │    Database     │                         │
│                    └─────────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
erp/
├── yamini/                    # Web Portal + Backend
│   ├── frontend/              # React Web Application
│   ├── backend/               # FastAPI Backend Server
│   ├── docs/                  # Documentation
│   └── scripts/               # Utility scripts
│
└── staff_app/                 # Mobile Application
    └── flutter_application_1/ # Flutter Cross-Platform App
```

---

## 🌐 Web Application (React)

**Location:** `yamini/frontend/`

### Tech Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2 | UI Framework |
| Vite | 5.0 | Build Tool |
| React Router | 6.20 | Navigation |
| Axios | 1.13 | HTTP Client |
| Leaflet | 1.9 | Maps Integration |
| Lucide React | 0.562 | Icons |
| jsPDF | 4.0 | PDF Generation |

### Features
- 📊 **Admin Dashboard** - Analytics, user management, reports
- 🎫 **Reception Portal** - Service requests, visitor management
- 💼 **Salesman Portal** - Enquiries, orders, customer management
- 🔧 **Engineer Portal** - Job management, service tracking
- 📋 **Customer Portal** - Bookings, complaints, feedback

### Commands
```bash
cd yamini/frontend

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Run E2E tests
npm run cypress
```

### Access
- **Development:** http://localhost:5173
- **Production:** Configure in deployment

---

## 📱 Mobile Application (Flutter)

**Location:** `staff_app/flutter_application_1/`

### Tech Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| Flutter | 3.10+ | Cross-platform Framework |
| Dart | 3.10.7+ | Programming Language |
| go_router | 14.6 | Navigation |
| http | 1.2 | API Communication |
| geolocator | 13.0 | GPS Location |
| image_picker | 1.1 | Camera/Gallery |
| flutter_map | 7.0 | Map Integration |
| qr_flutter | 4.1 | QR Code Generation |

### Supported Platforms
- ✅ Android
- ✅ iOS
- ✅ Web
- ✅ macOS
- ✅ Windows
- ✅ Linux

### Role-Based Features

| Role | Features |
|------|----------|
| **Admin** | Dashboard stats, user management, sales & service reports |
| **Reception** | Service requests, engineer assignment, visitor tracking |
| **Salesman** | Enquiries, follow-ups, orders, attendance, GPS tracking, customer visits |
| **Engineer** | Job management, schedule, check-in/out, status updates |

### Commands
```bash
cd staff_app/flutter_application_1

# Get dependencies
flutter pub get

# Run on Web (recommended for testing)
flutter run -d chrome

# Run on iOS Simulator
flutter run -d ios

# Run on Android Emulator
flutter run -d android

# Build APK
flutter build apk --release

# Build iOS
flutter build ios --release
```

### App Structure
```
lib/
├── main.dart           # Entry point
├── core/               # Constants, models, routing, services
│   ├── constants/      # App-wide constants
│   ├── models/         # Data models
│   ├── routing/        # go_router configuration
│   └── services/       # API & Auth services
└── features/           # Feature modules
    ├── admin/          # Admin screens & widgets
    ├── auth/           # Login, splash screen
    ├── reception/      # Reception dashboard
    ├── salesman/       # Salesman full module
    └── service/        # Engineer job management
```

---

## ⚙️ Backend API (FastAPI)

**Location:** `yamini/backend/`

### Tech Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | Latest | Web Framework |
| SQLAlchemy | ORM | Database ORM |
| PostgreSQL | 12+ | Database |
| Pydantic | V2 | Data Validation |
| JWT | - | Authentication |
| APScheduler | - | Task Scheduling |
| Bcrypt | - | Password Hashing |

### API Modules
| Module | Endpoint | Description |
|--------|----------|-------------|
| Auth | `/auth/*` | Login, registration, JWT tokens |
| Users | `/api/users/*` | User management |
| Customers | `/api/customers/*` | Customer CRUD |
| Enquiries | `/api/enquiries/*` | Sales enquiries |
| Orders | `/api/orders/*` | Order management |
| Service Requests | `/api/service-requests/*` | Service ticket system |
| Complaints | `/api/complaints/*` | Complaint handling |
| Attendance | `/api/attendance/*` | Staff attendance |
| Tracking | `/api/tracking/*` | GPS location tracking |
| Visitors | `/api/visitors/*` | Visitor management |
| Reports | `/api/reports/*` | Analytics & reports |
| Feedback | `/api/feedback/*` | Customer feedback |
| Chatbot | `/api/chatbot/*` | AI assistant |
| Invoices | `/api/invoices/*` | Invoice generation |
| Products | `/api/products/*` | Product catalog |
| Stock | `/api/stock-movements/*` | Inventory management |
| Analytics | `/api/analytics/*` | Business analytics |

### Commands
```bash
cd yamini/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Initialize database
python init_db.py

# Run development server
uvicorn main:app --reload --port 8000

# Run production server
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Access
- **API Server:** http://localhost:8000
- **Swagger Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## 🗄️ Database Setup

### PostgreSQL Installation

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt install postgresql
sudo systemctl start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### Create Database
```bash
psql -U postgres -c "CREATE DATABASE yamini_infotech;"
```

### Environment Configuration
```bash
# Copy example env file
cp yamini/backend/.env.example yamini/backend/.env

# Edit with your credentials
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/yamini_infotech
JWT_SECRET_KEY=your-secret-key-here
```

---

## 👥 Demo Accounts

After running `init_db.py`, these demo accounts are created:

| Username | Password | Role | Access |
|----------|----------|------|--------|
| `admin` | `admin123` | Admin | Full system access |
| `reception` | `reception123` | Reception | CRM, visitors, service requests |
| `salesman` | `sales123` | Salesman | Enquiries, orders, customers |
| `engineer` | `engineer123` | Engineer | Jobs, service tickets |
| `office` | `office123` | Office Staff | General operations |
| `customer` | `customer123` | Customer | Portal access |

> ⚠️ **Security:** Change default passwords in production!

---

## 🚀 Quick Start

### 1. Start Backend
```bash
cd yamini/backend
pip install -r requirements.txt
python init_db.py
uvicorn main:app --reload --port 8000
```

### 2. Start Web App
```bash
cd yamini/frontend
npm install
npm run dev
```

### 3. Start Mobile App
```bash
cd staff_app/flutter_application_1
flutter pub get
flutter run -d chrome  # or your preferred device
```

### Access Points
| Service | URL |
|---------|-----|
| Web App | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## 📚 Documentation

| Document | Location | Description |
|----------|----------|-------------|
| Architecture | `staff_app/flutter_application_1/ARCHITECTURE.md` | App architecture details |
| Folder Structure | `staff_app/flutter_application_1/FOLDER_STRUCTURE.md` | Code organization |
| Quick Start | `staff_app/flutter_application_1/QUICKSTART.md` | Getting started guide |
| UI Design | `yamini/docs/UI_DESIGN_SYSTEM.md` | Design system specs |
| Admin Guide | `yamini/docs/ADMIN_NOTIFICATIONS_GUIDE.md` | Admin features |
| Chatbot Setup | `yamini/CHATBOT_SETUP_GUIDE.md` | AI chatbot configuration |
| Testing Guide | `yamini/frontend/CYPRESS_TESTING_GUIDE.md` | E2E testing |

---

## 🔧 Development

### Code Quality
```bash
# Flutter format
cd staff_app/flutter_application_1
dart format lib/

# Flutter analyze
flutter analyze
```

### Testing
```bash
# Flutter tests
flutter test

# Cypress E2E tests
cd yamini/frontend
npm run cypress
```

---

## 📄 License

Proprietary - Yamini Infotech © 2024-2026

---

## 🤝 Support

For technical support, contact the development team at Yamini Infotech.
