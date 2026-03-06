# TECHNICAL AUDIT REPORT — Yamini Infotech ERP System

**Generated:** 2026-02-27  
**Auditor:** DevOps + Full Stack Architect  
**Target Deployment:** Ubuntu EC2 (AWS)  
**Workspace:** `/Users/ajaikumarn/Desktop/erpee/`

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Project Detection Matrix](#2-project-detection-matrix)
3. [Project 1 — Python/FastAPI Backend](#3-project-1--pythonfastapi-backend)
4. [Project 2 — React/Vite Frontend](#4-project-2--reactvite-frontend)
5. [Project 3 — Communication Worker (Background Process)](#5-project-3--communication-worker-background-process)
6. [Project 4 — Flutter Staff Mobile App](#6-project-4--flutter-staff-mobile-app)
7. [Service Manager & Startup Scripts](#7-service-manager--startup-scripts)
8. [Environment Variables Audit](#8-environment-variables-audit)
9. [Database Audit](#9-database-audit)
10. [Security Audit](#10-security-audit)
11. [Network Binding & Port Audit](#11-network-binding--port-audit)
12. [Production Configuration Issues](#12-production-configuration-issues)
13. [Complete Deployment Playbook (Ubuntu EC2)](#13-complete-deployment-playbook-ubuntu-ec2)
14. [Systemd Service Files](#14-systemd-service-files)
15. [Nginx Reverse Proxy Configuration](#15-nginx-reverse-proxy-configuration)
16. [Deployment Recommendations](#16-deployment-recommendations)

---

## 1. EXECUTIVE SUMMARY

| Metric | Value |
|---|---|
| **Total Projects Detected** | 4 (Backend, Frontend, Worker, Mobile App) |
| **Architecture** | Monorepo — Multi-service ERP |
| **Backend** | Python 3.11+ / FastAPI 0.115.0 / Uvicorn |
| **Frontend** | React 18 / Vite 5 / SPA |
| **Database** | PostgreSQL (psycopg2-binary) |
| **Mobile** | Flutter 3.10+ (Android/iOS/Web) |
| **Background Worker** | Python standalone process (communication queue) |
| **Cloud Storage** | AWS S3 (ap-south-1) |
| **Email** | Brevo SMTP |
| **AI/Chatbot** | Mistral AI + FAISS + Sentence-Transformers |
| **Containerization** | ❌ NONE (No Dockerfile, no docker-compose) |
| **Process Manager** | ❌ NONE (No PM2, no Supervisor) |
| **Reverse Proxy** | ❌ NONE (No Nginx config) |
| **SSL/TLS** | ❌ NOT CONFIGURED in application |
| **Systemd Services** | 1 (worker only — no backend/frontend service) |
| **Production Readiness** | ⚠️ PARTIALLY READY — significant gaps |

---

## 2. PROJECT DETECTION MATRIX

| Scan Target | Found? | Location |
|---|---|---|
| `package.json` | ✅ | `yamini/frontend/package.json` |
| `pom.xml` | ❌ | Not found (no Java/Spring Boot) |
| `build.gradle` | ✅ | `staff_app/flutter_application_1/android/build.gradle.kts` (Flutter only) |
| `requirements.txt` | ✅ | `yamini/backend/requirements.txt` |
| `Dockerfile` | ❌ | **Not found** |
| `docker-compose.yml` | ❌ | **Not found** |
| `.env` | ✅ | `yamini/backend/.env` |
| `.env.example` | ✅ | Backend + Frontend |
| `pubspec.yaml` | ✅ | `staff_app/flutter_application_1/pubspec.yaml` |
| `.jar` files | ❌ | Not found |
| `.service` files | ✅ | `yamini/backend/yamini-worker.service` |
| `.bat` scripts | ✅ | 5 files (Windows dev scripts) |
| `.sh` scripts | ✅ | `yamini/scripts/setup/setup.sh` |
| `ecosystem.config.js` | ❌ | Not found (no PM2) |

### Detected Project Types

| Project | Type | Framework | Category |
|---|---|---|---|
| `yamini/backend/` | Python | FastAPI + Uvicorn | **Backend API** |
| `yamini/frontend/` | Node.js | React 18 + Vite 5 | **Frontend SPA** |
| `yamini/backend/services/communication_worker.py` | Python | Standalone script | **Background Worker** |
| `staff_app/flutter_application_1/` | Dart | Flutter 3.10+ | **Mobile App** |

**NOT detected:** Spring Boot, Next.js, Express.js, Docker-based, Static website.

---

## 3. PROJECT 1 — PYTHON/FASTAPI BACKEND

### Overview

| Property | Value |
|---|---|
| **Path** | `yamini/backend/` |
| **Type** | Backend REST API |
| **Framework** | FastAPI 0.115.0 |
| **Server** | Uvicorn 0.30.6 |
| **Python** | 3.11+ required |
| **Database** | PostgreSQL via SQLAlchemy 2.0.35 |
| **Port** | `8000` |
| **Host Binding** | `0.0.0.0` ✅ (production-safe) |
| **API Docs** | `http://<host>:8000/docs` (Swagger UI) |
| **Health Check** | `GET /api/health` → `{"status": "ok"}` |

### Key Modules (37 Router Modules)

Auth, Users, Customers, Enquiries, Complaints, Service Requests, Service Engineer, Feedback, Attendance, MIF, Sales, Orders, Products, Product Management, Notifications, Bookings, Reports, Audit, Visitors, Stock Movements, Analytics, Invoices, Settings, Chatbot, Verified Attendance, Outstanding, Calls, Leads (CRM), Unified Tracking, Geofencing, WhatsApp Logs, Staff Notifications, SEO, Admin Sales.

### Background Schedulers (Inside Backend Process)

| Scheduler | Schedule | Purpose |
|---|---|---|
| APScheduler (Background) | Various cron triggers | SLA reminders, follow-ups, AMC alerts |
| APScheduler (Async) | Daily 18:30 IST | Daily report generation |
| Auto-stop tracking | Daily 18:30 IST | Stop GPS tracking sessions |

### How to Start (Development)

```bash
cd yamini/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### How to Start (Production)

```bash
cd /home/ubuntu/yamini_infotech/yamini/backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 --no-access-log
```

**Recommended (with Gunicorn for process management):**

```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile /var/log/yamini/access.log \
  --error-logfile /var/log/yamini/error.log \
  --timeout 120
```

### Auto-Start

❌ **No systemd service exists for the backend.** Must be created (see Section 14).

---

## 4. PROJECT 2 — REACT/VITE FRONTEND

### Overview

| Property | Value |
|---|---|
| **Path** | `yamini/frontend/` |
| **Type** | Frontend SPA |
| **Framework** | React 18.2 + Vite 5.0 |
| **Build Tool** | Vite (zero-config, no vite.config.js) |
| **Port (Dev)** | `5173` |
| **Production Domain** | `https://yaminicopier.com` |
| **API Target** | `VITE_API_URL` env var → fallback `https://api.yaminicopier.com` |

### Key Dependencies

- `react-router-dom` (SPA routing)
- `axios` (HTTP client)
- `leaflet` / `react-leaflet` (Maps)
- `jspdf` / `jspdf-autotable` (PDF generation)
- `lucide-react` / `react-icons` (Icons)
- `cypress` (E2E testing)

### How to Build (Production)

```bash
cd yamini/frontend
npm install
VITE_API_URL=https://api.yaminicopier.com npm run build
```

This produces a static `dist/` folder.

### How to Serve (Production)

**This is a static SPA. In production, serve via Nginx — NOT `npm run dev`.**

```bash
# Build outputs to yamini/frontend/dist/
# Serve via Nginx (see Section 15)
```

### Dev Start

```bash
cd yamini/frontend
npm install
npm run dev   # http://localhost:5173
```

### Auto-Start

❌ **No service exists.** Served via Nginx in production (static files, no process needed).

---

## 5. PROJECT 3 — COMMUNICATION WORKER (BACKGROUND PROCESS)

### Overview

| Property | Value |
|---|---|
| **Path** | `yamini/backend/services/communication_worker.py` |
| **Type** | Background queue processor |
| **Runtime** | Standalone Python process (NOT inside FastAPI) |
| **Purpose** | Process WhatsApp notifications from DB queue |
| **Poll Interval** | 8 seconds |
| **Retry Strategy** | Exponential: 1m → 5m → 15m → 30m → 60m |
| **Queue Storage** | PostgreSQL `communication_queue` table |
| **Concurrency Control** | `FOR UPDATE SKIP LOCKED` |

### How to Start

```bash
cd /home/ubuntu/yamini_infotech/yamini/backend
source venv/bin/activate
python services/communication_worker.py
```

### Auto-Start

✅ **Systemd service EXISTS:** `yamini-worker.service`

```bash
sudo cp yamini-worker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable yamini-worker
sudo systemctl start yamini-worker
```

---

## 6. PROJECT 4 — FLUTTER STAFF MOBILE APP

### Overview

| Property | Value |
|---|---|
| **Path** | `staff_app/flutter_application_1/` |
| **Type** | Cross-platform mobile app (Android/iOS/Web) |
| **Framework** | Flutter 3.10+ / Dart |
| **Architecture** | Feature-first (core/ + features/) |
| **API Target** | `https://api.yaminicopier.com` (hardcoded) |
| **Push Notifications** | Firebase Cloud Messaging |
| **GPS Tracking** | Geolocator + Geocoding |
| **Auth** | JWT stored in flutter_secure_storage |

### Modules

- Auth (login/logout)
- Salesman (tracking, leads, visits)
- Service Engineer (complaints, service requests)
- Reception (visitors, enquiries)
- Admin (dashboard)
- Attendance (photo + GPS verification)

### How to Build

```bash
cd staff_app/flutter_application_1

# Android APK
flutter build apk --release

# Android App Bundle (Play Store)
flutter build appbundle --release

# iOS (requires macOS + Xcode)
flutter build ios --release
```

### Security Issue

⚠️ **SSL certificate verification is DISABLED** in `dio_client.dart`:
```dart
badCertificateCallback: (cert, host, port) => true  // INSECURE
```
This must be removed for production.

### Auto-Start

N/A — Mobile app, installed on user devices.

---

## 7. SERVICE MANAGER & STARTUP SCRIPTS

### Service Managers Detected

| Manager | Status |
|---|---|
| PM2 | ❌ Not installed/configured |
| systemd | ⚠️ Partial (worker only) |
| Supervisor | ❌ Not installed/configured |
| Docker | ❌ Not installed/configured |

### Startup Scripts

| Script | Platform | Purpose |
|---|---|---|
| `start_all.bat` | Windows | Starts backend + frontend in separate cmd windows |
| `yamini/backend/start_backend.bat` | Windows | Starts uvicorn with --reload |
| `yamini/frontend/start_frontend.bat` | Windows | Runs `npm run dev` |
| `yamini/backend/setup_windows.bat` | Windows | Creates venv, installs deps |
| `yamini/backend/database_manager.bat` | Windows | DB export/import/create |
| `yamini/scripts/setup/setup.sh` | Linux/macOS | Backend setup (venv, deps, DB) |

**Critical Gap:** All `.bat` scripts are Windows-only. No Linux `.sh` equivalents exist for starting services, only for initial setup.

---

## 8. ENVIRONMENT VARIABLES AUDIT

### Backend Required Variables

| Variable | Required | Current Value (in .env) | Notes |
|---|---|---|---|
| `DATABASE_URL` | ✅ REQUIRED | `postgresql://postgres:postgres@localhost:5432/yamini_infotech` | ⚠️ Default password |
| `JWT_SECRET_KEY` | ✅ REQUIRED | ❌ **NOT SET IN .env** | `.env` has `SECRET_KEY` but `auth.py` reads `JWT_SECRET_KEY` — **STARTUP WILL CRASH** |
| `HOST` | Optional | `0.0.0.0` | ✅ Good |
| `PORT` | Optional | `8000` | ✅ Good |
| `FRONTEND_URL` | Optional | Not set (defaults to `http://localhost:5173`) | ⚠️ Must set for production |
| `ALLOWED_ORIGINS` | Optional | Empty (uses hardcoded list) | ⚠️ Must set for production |
| `AWS_ACCESS_KEY_ID` | Required (for uploads) | Set | ⚠️ Credentials in .env |
| `AWS_SECRET_ACCESS_KEY` | Required (for uploads) | Set | ⚠️ Credentials in .env |
| `AWS_REGION` | Required (for uploads) | `ap-south-1` | ✅ |
| `AWS_S3_BUCKET` | Required (for uploads) | `yamini-infotech-erp-files` | ✅ |
| `BREVO_SMTP_USERNAME` | Optional | Set | For email reports |
| `BREVO_SMTP_PASSWORD` | Optional | Set | For email reports |
| `ADMIN_EMAIL` | Optional | `ajaikumar0609@gmail.com` | Email report recipient |
| `MISTRAL_API_KEY` | Optional | Not set | For AI chatbot |

### Frontend Required Variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `VITE_API_URL` | ✅ At build time | `https://api.yaminicopier.com` | Baked into JS bundle at build |
| `VITE_APP_ENV` | Optional | `development` | |

### CRITICAL BUG: JWT_SECRET_KEY MISMATCH

```
.env defines:          SECRET_KEY=yamini_infotech_secret_key_2025
auth.py reads:         os.getenv("JWT_SECRET_KEY")  ← DIFFERENT NAME
auth.py behavior:      raises RuntimeError if JWT_SECRET_KEY is not set
```

**Impact:** Backend will crash on startup if `JWT_SECRET_KEY` is not set. Either rename `.env` key to `JWT_SECRET_KEY` or add it as a second line.

---

## 9. DATABASE AUDIT

| Property | Value |
|---|---|
| **Engine** | PostgreSQL |
| **Driver** | psycopg2-binary 2.9.9 |
| **ORM** | SQLAlchemy 2.0.35 |
| **DB Name** | `yamini_infotech` |
| **Connection** | Via `DATABASE_URL` env var |
| **Auto-migration** | `models.Base.metadata.create_all(bind=engine)` on startup |
| **Manual Migrations** | Multiple scripts in `yamini/backend/migrations/` |

### Hardcoded DB Credentials Found

| Location | Hardcoded Value |
|---|---|
| `yamini/backend/.env` | `postgresql://postgres:postgres@localhost:5432/yamini_infotech` |
| `migrations/add_manual_metric_columns.py` | Fallback: `postgresql://postgres:postgres@localhost:5432/yamini_infotech` |
| `migrations/add_soft_delete_fields.py` | Same fallback |
| `migrations/add_daily_report_fields.py` | Same fallback |
| `scripts/migrations/add_complaint_fields.py` | Same fallback (no `load_dotenv()`) |
| `database_manager.bat` | Hardcoded user: `postgres`, db: `yamini_infotech` |

### Production DB Recommendations

```bash
# On EC2, use RDS or local PostgreSQL with strong credentials:
DATABASE_URL=postgresql://yamini_user:$(openssl rand -base64 32)@<rds-endpoint>:5432/yamini_infotech

# Or local PostgreSQL:
sudo -u postgres psql -c "CREATE USER yamini_user WITH PASSWORD '<strong-password>';"
sudo -u postgres psql -c "CREATE DATABASE yamini_infotech OWNER yamini_user;"
```

---

## 10. SECURITY AUDIT

### CRITICAL Issues

| # | Issue | Severity | Location |
|---|---|---|---|
| 1 | **JWT secret key mismatch** — `.env` has `SECRET_KEY`, code reads `JWT_SECRET_KEY` | 🔴 CRITICAL | `auth.py` / `.env` |
| 2 | **Weak JWT secret** — `yamini_infotech_secret_key_2025` is easily guessable | 🔴 CRITICAL | `.env` |
| 3 | **Default DB password** — `postgres:postgres` | 🔴 CRITICAL | `.env` |
| 4 | **AWS credentials in .env** — if repo is leaked, S3 is compromised | 🟡 HIGH | `.env` |
| 5 | **SMTP credentials in .env** — Brevo account exposed | 🟡 HIGH | `.env` |
| 6 | **SSL verification disabled** in Flutter app | 🟡 HIGH | `dio_client.dart` |
| 7 | **No rate limiting** on API endpoints | 🟡 MEDIUM | `main.py` |
| 8 | **Swagger UI exposed** at `/docs` in production | 🟡 MEDIUM | `main.py` |
| 9 | **No HTTPS enforcement** at application level | 🟡 MEDIUM | `main.py` |
| 10 | **`--reload` flag** in all start scripts | 🟡 MEDIUM | `.bat` files |

### Recommendations

```bash
# Generate strong JWT secret
python3 -c "import secrets; print(secrets.token_urlsafe(64))"

# Use AWS IAM role instead of access keys (on EC2)
# Attach IAM role with S3 access to EC2 instance — no keys needed

# Disable Swagger in production
# In main.py, conditionally:
# app = FastAPI(docs_url=None, redoc_url=None) if os.getenv("ENV") == "production"
```

---

## 11. NETWORK BINDING & PORT AUDIT

### Port Allocation

| Service | Port | Binding | Status |
|---|---|---|---|
| FastAPI Backend | `8000` | `0.0.0.0` | ✅ Accessible externally |
| Vite Dev Server | `5173` | `localhost` | ⚠️ Dev only — not for production |
| PostgreSQL | `5432` | `localhost` (default) | ✅ Should stay local |

### Hardcoded localhost References

| File | Reference | Risk |
|---|---|---|
| `main.py` | CORS: `http://localhost:5173`, `http://127.0.0.1:5173` etc. | ⚠️ Dev origins in prod code |
| `services/whatsapp_service.py` | `FRONTEND_URL` default: `http://localhost:5173` | ⚠️ Links in WhatsApp messages wrong |
| `routers/service_requests.py` | `FRONTEND_URL` default: `http://localhost:5173` | ⚠️ Links in notifications wrong |
| `frontend/src/config.js` | Fallback: `https://api.yaminicopier.com` | ✅ Good production default |
| `staff_app/.../api_constants.dart` | Hardcoded: `https://api.yaminicopier.com` | ✅ Production URL set |
| Multiple migration scripts | `postgresql://postgres:postgres@localhost:5432/...` | ⚠️ Won't work on separate DB host |

### Production Fix Required

Set `FRONTEND_URL` and `ALLOWED_ORIGINS` in the production `.env`:
```env
FRONTEND_URL=https://yaminicopier.com
ALLOWED_ORIGINS=https://yaminicopier.com,https://www.yaminicopier.com
```

---

## 12. PRODUCTION CONFIGURATION ISSUES

| # | Issue | Impact | Fix |
|---|---|---|---|
| 1 | No Dockerfile / docker-compose | Cannot containerize | Create Dockerfile (optional if using systemd) |
| 2 | No Nginx reverse proxy | Backend exposed on port 8000 directly | Create Nginx config (see Section 15) |
| 3 | No SSL certificates | HTTP only | Use Certbot + Nginx |
| 4 | No systemd for backend | Backend won't auto-restart | Create service file (see Section 14) |
| 5 | No systemd for frontend build serve | Frontend not auto-served | Nginx handles this (static files) |
| 6 | `--reload` in all scripts | File watcher in production wastes resources | Remove for production |
| 7 | No log rotation | Logs fill disk | Configure logrotate |
| 8 | No firewall rules documented | All ports potentially open | Configure UFW |
| 9 | No backup strategy | Data loss risk | Configure pg_dump cron |
| 10 | CORS allows dev origins in production | Potential CORS bypass | Use `ALLOWED_ORIGINS` env var |

---

## 13. COMPLETE DEPLOYMENT PLAYBOOK (UBUNTU EC2)

### Step 1: System Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11+
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 15
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Database Setup

```bash
# Create database user and database
sudo -u postgres psql <<EOF
CREATE USER yamini_user WITH PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
CREATE DATABASE yamini_infotech OWNER yamini_user;
GRANT ALL PRIVILEGES ON DATABASE yamini_infotech TO yamini_user;
EOF
```

### Step 3: Deploy Backend

```bash
# Create app directory
sudo mkdir -p /home/ubuntu/yamini_infotech
cd /home/ubuntu/yamini_infotech

# Clone or copy your code
# git clone <repo> . OR scp -r ...

# Setup Python virtual environment
cd yamini/backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn  # Add production server

# Create production .env
cat > .env <<'EOF'
DATABASE_URL=postgresql://yamini_user:YOUR_STRONG_PASSWORD_HERE@localhost:5432/yamini_infotech
JWT_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))")
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=https://yaminicopier.com
ALLOWED_ORIGINS=https://yaminicopier.com,https://www.yaminicopier.com
BREVO_SMTP_USERNAME=your_smtp_user
BREVO_SMTP_PASSWORD=your_smtp_password
ADMIN_EMAIL=admin@yaminicopier.com
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=yamini-infotech-erp-files
EOF

# Test startup
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
# Ctrl+C if working
```

### Step 4: Build Frontend

```bash
cd /home/ubuntu/yamini_infotech/yamini/frontend
npm install

# Build with production API URL
VITE_API_URL=https://api.yaminicopier.com VITE_APP_ENV=production npm run build

# Output: yamini/frontend/dist/
```

### Step 5: Install Systemd Services

```bash
# Copy service files (see Section 14 for contents)
sudo cp yamini-backend.service /etc/systemd/system/
sudo cp yamini-worker.service /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable yamini-backend yamini-worker
sudo systemctl start yamini-backend yamini-worker

# Check status
sudo systemctl status yamini-backend
sudo systemctl status yamini-worker
```

### Step 6: Configure Nginx

```bash
# Copy nginx config (see Section 15)
sudo cp yamini-nginx.conf /etc/nginx/sites-available/yaminicopier.com
sudo ln -s /etc/nginx/sites-available/yaminicopier.com /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: SSL Certificate

```bash
sudo certbot --nginx -d yaminicopier.com -d www.yaminicopier.com -d api.yaminicopier.com
# Auto-renewal is configured by certbot
```

### Step 8: Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 8000       # Block direct backend access
sudo ufw deny 5432       # Block direct DB access
sudo ufw enable
```

---

## 14. SYSTEMD SERVICE FILES

### yamini-backend.service (CREATE THIS)

```ini
[Unit]
Description=Yamini Infotech ERP Backend (FastAPI + Gunicorn)
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=exec
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/yamini_infotech/yamini/backend
Environment="PATH=/home/ubuntu/yamini_infotech/yamini/backend/venv/bin:/usr/local/bin:/usr/bin"
ExecStart=/home/ubuntu/yamini_infotech/yamini/backend/venv/bin/gunicorn main:app \
    -w 4 \
    -k uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --access-logfile /var/log/yamini/access.log \
    --error-logfile /var/log/yamini/error.log \
    --timeout 120 \
    --graceful-timeout 30
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=/home/ubuntu/yamini_infotech/yamini/backend/uploads
ReadWritePaths=/var/log/yamini

[Install]
WantedBy=multi-user.target
```

### yamini-worker.service (ALREADY EXISTS — verified correct)

```ini
[Unit]
Description=Yamini Communication Worker (Queue Processor)
After=network.target postgresql.service yamini-backend.service
Wants=yamini-backend.service

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/yamini_infotech/yamini/backend
Environment="PATH=/home/ubuntu/yamini_infotech/yamini/backend/venv/bin:/usr/local/bin:/usr/bin"
ExecStart=/home/ubuntu/yamini_infotech/yamini/backend/venv/bin/python services/communication_worker.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Pre-requisite: Create log directory

```bash
sudo mkdir -p /var/log/yamini
sudo chown ubuntu:ubuntu /var/log/yamini
```

### Commands to Manage Services

```bash
# Start all
sudo systemctl start yamini-backend yamini-worker

# Stop all
sudo systemctl stop yamini-backend yamini-worker

# Restart all
sudo systemctl restart yamini-backend yamini-worker

# View logs
sudo journalctl -u yamini-backend -f
sudo journalctl -u yamini-worker -f

# Enable on boot
sudo systemctl enable yamini-backend yamini-worker

# Check status
sudo systemctl status yamini-backend yamini-worker
```

---

## 15. NGINX REVERSE PROXY CONFIGURATION

### `/etc/nginx/sites-available/yaminicopier.com`

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yaminicopier.com www.yaminicopier.com api.yaminicopier.com;
    return 301 https://$host$request_uri;
}

# Frontend — yaminicopier.com
server {
    listen 443 ssl http2;
    server_name yaminicopier.com www.yaminicopier.com;

    # SSL (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/yaminicopier.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yaminicopier.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /home/ubuntu/yamini_infotech/yamini/frontend/dist;
    index index.html;

    # SPA catch-all — let React Router handle client-side routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;
}

# Backend API — api.yaminicopier.com
server {
    listen 443 ssl http2;
    server_name api.yaminicopier.com;

    # SSL (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/yaminicopier.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yaminicopier.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed for future features)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_read_timeout 120s;
        proxy_send_timeout 60s;
    }

    # Serve uploaded files directly via Nginx (faster than Python)
    location /uploads/ {
        alias /home/ubuntu/yamini_infotech/yamini/backend/uploads/;
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

---

## 16. DEPLOYMENT RECOMMENDATIONS

### Priority 1 — CRITICAL (Do Before Going Live)

| # | Action | Details |
|---|---|---|
| 1 | **Fix JWT_SECRET_KEY mismatch** | Rename `SECRET_KEY` to `JWT_SECRET_KEY` in `.env` |
| 2 | **Generate strong JWT secret** | `python3 -c "import secrets; print(secrets.token_urlsafe(64))"` |
| 3 | **Change PostgreSQL password** | Never use `postgres:postgres` in production |
| 4 | **Create systemd service for backend** | Use the `.service` file from Section 14 |
| 5 | **Set up Nginx reverse proxy** | Use config from Section 15 |
| 6 | **Install SSL certificate** | `sudo certbot --nginx -d yaminicopier.com ...` |
| 7 | **Configure UFW firewall** | Block ports 8000, 5432 from external access |
| 8 | **Set `ALLOWED_ORIGINS`** | Production domains only |
| 9 | **Set `FRONTEND_URL`** | `https://yaminicopier.com` |
| 10 | **Remove `--reload` from production** | File watcher is dev-only |

### Priority 2 — HIGH (Production Hardening)

| # | Action | Details |
|---|---|---|
| 1 | **Use IAM roles instead of AWS keys** | Attach S3 role to EC2 instance |
| 2 | **Disable Swagger in production** | Set `docs_url=None` when `ENV=production` |
| 3 | **Add rate limiting** | Use `slowapi` or Nginx `limit_req` |
| 4 | **Configure log rotation** | `/etc/logrotate.d/yamini` |
| 5 | **Fix Flutter SSL verification** | Remove `badCertificateCallback` override |
| 6 | **Set up automated DB backups** | Cron job with `pg_dump` |
| 7 | **Install `gunicorn`** | Add to `requirements.txt` |

### Priority 3 — RECOMMENDED (Operational Excellence)

| # | Action | Details |
|---|---|---|
| 1 | **Add health check monitoring** | Use CloudWatch or UptimeRobot on `/api/health` |
| 2 | **Create deployment script** | `deploy.sh` with git pull, build, restart |
| 3 | **Containerize with Docker** | Create Dockerfile + docker-compose |
| 4 | **Set up CI/CD** | GitHub Actions for automated deployments |
| 5 | **Add APM** | Sentry or similar for error tracking |
| 6 | **Create Linux start scripts** | `.sh` equivalents of all `.bat` files |
| 7 | **Move to RDS** | Managed PostgreSQL for auto-backups and HA |

### Quick Reference — All Start Commands

| Service | Manual Start | Background (systemd) | Auto-Start on Reboot |
|---|---|---|---|
| **Backend** | `cd yamini/backend && source venv/bin/activate && gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000` | `sudo systemctl start yamini-backend` | `sudo systemctl enable yamini-backend` |
| **Worker** | `cd yamini/backend && source venv/bin/activate && python services/communication_worker.py` | `sudo systemctl start yamini-worker` | `sudo systemctl enable yamini-worker` |
| **Frontend** | `cd yamini/frontend && npm run build` (then serve via Nginx) | Nginx serves static files | `sudo systemctl enable nginx` |
| **PostgreSQL** | `sudo systemctl start postgresql` | Already a systemd service | `sudo systemctl enable postgresql` |
| **Nginx** | `sudo systemctl start nginx` | Already a systemd service | `sudo systemctl enable nginx` |

### Log Rotation Config

Create `/etc/logrotate.d/yamini`:

```
/var/log/yamini/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 ubuntu ubuntu
    postrotate
        systemctl reload yamini-backend 2>/dev/null || true
    endscript
}
```

### Automated Database Backup

Add to `crontab -e`:

```bash
# Daily backup at 2 AM
0 2 * * * pg_dump -U yamini_user yamini_infotech | gzip > /home/ubuntu/backups/yamini_$(date +\%Y\%m\%d).sql.gz

# Weekly cleanup of backups older than 30 days
0 3 * * 0 find /home/ubuntu/backups/ -name "*.sql.gz" -mtime +30 -delete
```

---

## END OF AUDIT REPORT

**Summary:** This is a well-structured monorepo ERP system with a FastAPI backend, React SPA frontend, background communication worker, and Flutter mobile app. The codebase is functionally complete but requires critical security fixes (JWT key mismatch, weak secrets, default DB credentials) and infrastructure provisioning (systemd services, Nginx, SSL, firewall) before production deployment on Ubuntu EC2.
