# 🔐 LOGIN CREDENTIALS - YAMINI INFOTECH ERP

**Application URL:** http://localhost:5173

---

## 📋 ALL USER ACCOUNTS

| ID | Username | Password | Role | Dashboard URL |
|----|----------|----------|------|---------------|
| 1 | `admin` | `admin123` | ADMIN | http://localhost:5173/admin/dashboard |
| 2 | `reception` | `reception123` | RECEPTION | http://localhost:5173/reception/dashboard |
| 3 | `salesman` | `sales123` | SALESMAN | http://localhost:5173/salesman/dashboard |
| 4 | `engineer` | `engineer123` | SERVICE_ENGINEER | http://localhost:5173/engineer/dashboard |
| 5 | `office` | `office123` | RECEPTION | http://localhost:5173/reception/dashboard |
| 6 | `customer` | `customer123` | CUSTOMER | http://localhost:5173/customer |
| 9 | `bala` | `bala1234` | SERVICE_ENGINEER | http://localhost:5173/engineer/dashboard |
| 11 | `ajaik` | `ajai1234` | RECEPTION | http://localhost:5173/reception/dashboard |

---

## 🎯 RECOMMENDED TEST ACCOUNTS

### 👨‍💼 **Admin Account**
```
Username: admin
Password: admin123
Access: All features
```

### 📞 **Reception Account** (For testing reception menu pages)
```
Username: ajaik
Password: ajai1234
Access: Reception Dashboard + 8 Menu Pages
```

### 💼 **Salesman Account**
```
Username: salesman
Password: sales123
Access: Salesman Dashboard
```

### 🔧 **Service Engineer Account** (For testing service features)
```
Username: bala
Password: bala1234
Access: Service Engineer Dashboard
```

---

## 🧭 NAVIGATION AFTER LOGIN

### After logging in, you will be automatically redirected to:

- **ADMIN** → `/admin/dashboard`
- **RECEPTION** → `/reception/dashboard` (with sidebar menu)
- **SALESMAN** → `/salesman/dashboard`
- **SERVICE_ENGINEER** → `/engineer/dashboard`
- **CUSTOMER** → `/customer`

---

## 📞 RECEPTION MENU PAGES

When logged in as **Reception** (ajaik/ajai1234), click the **hamburger menu** to access:

1. 📊 Dashboard - Summary View
2. 📋 Enquiry Board - Full Data
3. 📞 Calls & Target - History
4. 🔧 Service Complaints - Full Data
5. ⚠️ Repeat Complaints - Alert View
6. 📦 Delivery Log - IN / OUT
7. ₹ Outstanding - Read-only
8. ⚠️ Missing Reports - Employee Discipline
9. 🚶 Visitor Log - Entry Register

---

## ⚠️ IMPORTANT NOTES

### Access Control:
- **SERVICE_ENGINEER** (bala) CANNOT access Reception pages ❌
- **RECEPTION** (ajaik) CANNOT access Engineer pages ❌
- **SALESMAN** (salesman) CANNOT access Reception or Engineer pages ❌
- **ADMIN** (admin) CAN access ALL pages ✅

### Common Issue:
If you login as `bala/bala1234` and see "Access Denied" on reception pages:
- ✅ **This is CORRECT behavior**
- You should be at `/engineer/dashboard` not `/reception/*`
- Use `ajaik/ajai1234` to access reception pages

---

## 🔄 QUICK START TESTING

1. **Start both servers:**
   ```bash
   # Terminal 1 - Frontend
   cd /Users/ajaikumarn/Desktop/ui\ 2/frontend && npm run dev
   
   # Terminal 2 - Backend
   cd /Users/ajaikumarn/Desktop/ui\ 2/backend && uvicorn main:app --reload --port 8000
   ```

2. **Open browser:** http://localhost:5173

3. **Test Reception Features:**
   - Login: `ajaik` / `ajai1234`
   - Click hamburger menu
   - Test all 8 menu pages

4. **Test Service Engineer:**
   - Logout
   - Login: `bala` / `bala1234`
   - View assigned service requests

5. **Test Admin:**
   - Logout
   - Login: `admin` / `admin123`
   - Access all features

---

## 🛠️ TROUBLESHOOTING

### "Access Denied" Error:
- **Check your role** - You might be logged in with wrong account
- **Check the URL** - Each role has specific allowed routes
- **Logout and login again** with the correct account

### Connection Refused:
- **Check backend:** `lsof -i:8000` (should show Python process)
- **Check frontend:** `lsof -i:5173` (should show node process)
- **Restart servers** if needed

### Sidebar Not Showing:
- **Hard refresh:** Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- **Clear cache:** Developer Tools → Application → Clear Storage
- **Check login role:** Sidebar only shows for Reception/Admin on reception pages

---

**Last Updated:** December 24, 2025  
**System Status:** ✅ Fully Operational
