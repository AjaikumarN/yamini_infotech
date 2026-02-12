# 🧪 Cypress Testing Guide - Salesman Portal

## 📋 Overview

This document provides a complete guide to running and maintaining E2E tests for the Salesman Portal using Cypress.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Development Servers
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend
uvicorn main:app --reload
```

### 3. Run Tests

#### Interactive Mode (GUI)
```bash
npm run cypress
```

#### Headless Mode (CI/CD)
```bash
npm run cypress:run
```

#### Salesman Tests Only
```bash
npm run test:e2e
```

#### Browser Mode (Chrome)
```bash
npm run test:e2e:headed
```

---

## 📂 Test Structure

```
cypress/
├── e2e/
│   └── salesman/
│       ├── dashboard.cy.js      # Dashboard tests
│       ├── attendance.cy.js     # Attendance + GPS mock
│       ├── calls.cy.js          # Call logging
│       ├── enquiries.cy.js      # Enquiry management
│       ├── followups.cy.js      # Follow-up viewing
│       ├── orders.cy.js         # Orders page
│       └── daily-report.cy.js   # Report submission
├── support/
│   ├── commands.js    # Custom commands
│   └── e2e.js         # Setup file
└── cypress.config.js  # Configuration
```

---

## 🛠️ Custom Commands

### Login Commands
```javascript
// Login as salesman
cy.loginAsSalesman()

// Login as admin
cy.loginAsAdmin()
```

### Navigation
```javascript
// Navigate to salesman page
cy.goToSalesmanPage('calls')       // /salesman/calls
cy.goToSalesmanPage('attendance')  // /salesman/attendance
```

### GPS Mocking
```javascript
// Mock geolocation
cy.mockGeolocation(13.0827, 80.2707)  // Chennai coordinates
cy.mockGeolocation(12.9716, 77.5946)  // Bangalore coordinates
```

### File Upload
```javascript
// Upload file
cy.uploadFile('input[type="file"]', 'photo.png', 'image/png')
```

### Toast Notifications
```javascript
// Check for toast message
cy.shouldShowToast('Attendance marked successfully')
```

---

## 📝 Test Suites

### 1. Dashboard Tests (`dashboard.cy.js`)
**Purpose:** Verify dashboard loads correctly with stats and quick actions

**Test Cases:**
- [x] Dashboard loads successfully
- [x] Summary stats cards display
- [x] Attendance reminder shows if not marked
- [x] Quick action buttons work
- [x] Navigate to calls page from quick action
- [x] Toggle analytics view
- [x] Mobile responsiveness

**Example:**
```javascript
describe('Salesman Dashboard', () => {
  beforeEach(() => {
    cy.loginAsSalesman();
    cy.visit('/salesman/dashboard');
  });

  it('should load dashboard successfully', () => {
    cy.get('.page-title').should('contain', 'Dashboard');
    cy.get('.page-description').should('be.visible');
  });
});
```

---

### 2. Attendance Tests (`attendance.cy.js`)
**Purpose:** Test attendance marking with photo and GPS

**Test Cases:**
- [x] Attendance page loads
- [x] Shows form if not marked
- [x] Shows "Already marked" message if exists
- [x] Requires photo before submission
- [x] Photo upload and preview works
- [x] Mark attendance with GPS
- [x] Handles GPS permission denied
- [x] Mobile responsive

**Example:**
```javascript
it('should mark attendance with photo and GPS', () => {
  cy.mockGeolocation(13.0827, 80.2707);
  
  cy.get('.attendance-banner').then(($banner) => {
    if ($banner.hasClass('not-marked')) {
      cy.uploadFile('input[type="file"]', 'test-attendance.png');
      cy.get('button[type="submit"]').click();
      cy.wait(3000);
    }
  });
});
```

---

### 3. Calls Tests (`calls.cy.js`)
**Purpose:** Test call logging with voice-to-text

**Test Cases:**
- [x] Calls page loads
- [x] "Log Call" button visible
- [x] Toggle call form
- [x] Display form fields
- [x] Voice input button and language selector
- [x] Submit call with valid data
- [x] Require mandatory fields
- [x] Filter calls (Today/Week/All)
- [x] Display calls in card grid
- [x] Mobile responsive
- [x] Export functionality

**Example:**
```javascript
it('should submit call with valid data', () => {
  cy.get('.btn').contains('Log Call').click();
  
  cy.get('input[type="text"]').first().type('Test Customer');
  cy.get('input[type="tel"]').type('9876543210');
  cy.get('textarea').type('Discussed pricing');
  cy.get('select').last().select('interested');
  
  cy.get('button[type="submit"]').click();
  cy.wait(2000);
});
```

---

### 4. Enquiries Tests (`enquiries.cy.js`)
**Purpose:** Test enquiry viewing and management

**Test Cases:**
- [x] Enquiries page loads
- [x] Display enquiries or empty state
- [x] Filter by status
- [x] Filter by priority
- [x] Show enquiry details on card
- [x] Action buttons on cards
- [x] Mobile responsive

---

### 5. Follow-Ups Tests (`followups.cy.js`)
**Purpose:** Test follow-up display and call actions

**Test Cases:**
- [x] Follow-ups page loads
- [x] Show follow-ups or empty state
- [x] Display badges correctly
- [x] "Call Now" action button
- [x] Show last contact date
- [x] Mobile responsive

---

### 6. Orders Tests (`orders.cy.js`)
**Purpose:** Test order viewing

**Test Cases:**
- [x] Orders page loads
- [x] Display orders or empty state
- [x] "Create Order" button visible
- [x] Mobile responsive

---

### 7. Daily Report Tests (`daily-report.cy.js`)
**Purpose:** Test daily report submission

**Test Cases:**
- [x] Daily report page loads
- [x] Show report form if not submitted
- [x] All report fields present
- [x] Submit report with valid data
- [x] Show "already submitted" message
- [x] Mobile responsive

---

## 🎯 Test Data

### Test Credentials
```javascript
// Salesman
Username: salesman_test
Password: Test@123

// Admin
Username: admin
Password: Admin@123
```

### Mock Data
```javascript
// GPS Coordinates
Chennai: 13.0827, 80.2707
Bangalore: 12.9716, 77.5946

// Phone Numbers
Test: 9876543210, 9123456789
```

---

## 🔍 Debugging Tests

### Visual Debugging
```bash
# Open Cypress with browser
npm run cypress

# Select test file
# Click test to run
# View real-time execution
```

### Screenshots and Videos
- Screenshots saved on failure: `cypress/screenshots/`
- Videos disabled by default (configure in `cypress.config.js`)

### Console Logs
```javascript
// Add debug logs in tests
cy.log('Checking attendance status');
cy.get('.attendance-banner').then(($el) => {
  console.log('Banner class:', $el.attr('class'));
});
```

---

## ⚙️ Configuration

### `cypress.config.js`
```javascript
{
  baseUrl: 'http://localhost:5173',
  specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
  video: false,
  screenshotOnRunFailure: true,
  viewportWidth: 1280,
  viewportHeight: 720,
  defaultCommandTimeout: 10000,
  env: {
    API_URL: 'http://localhost:8000'
  }
}
```

---

## 📊 CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  cypress-run:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Start servers
        run: |
          npm run dev &
          cd backend && uvicorn main:app --reload &
      
      - name: Run Cypress tests
        run: npm run test:e2e
      
      - name: Upload screenshots
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-screenshots
          path: cypress/screenshots
```

---

## 🐛 Common Issues

### Issue 1: Login Fails
**Solution:** Check credentials in `commands.js`

### Issue 2: GPS Mock Not Working
**Solution:** Call `cy.mockGeolocation()` before form submission

### Issue 3: File Upload Fails
**Solution:** Use `{ force: true }` option in `selectFile()`

### Issue 4: Timeout Errors
**Solution:** Increase timeout in `cypress.config.js`

---

## 📈 Test Coverage

| Page | Test Cases | Status |
|------|------------|--------|
| Dashboard | 7 | ✅ |
| Attendance | 8 | ✅ |
| Calls | 10 | ✅ |
| Enquiries | 6 | ✅ |
| Follow-Ups | 6 | ✅ |
| Orders | 4 | ✅ |
| Daily Report | 6 | ✅ |
| **Total** | **47** | ✅ |

---

## 🎓 Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Mock external dependencies** (GPS, API calls)
3. **Keep tests independent** - each test should work alone
4. **Use beforeEach** for common setup
5. **Avoid hardcoded waits** - use `cy.wait()` for API calls only
6. **Test happy path first**, then edge cases
7. **Mobile test with viewport** - `cy.viewport('iphone-x')`

---

## 📞 Support

For issues or questions:
- Check test logs: `cypress/videos/` and `cypress/screenshots/`
- Review Cypress docs: https://docs.cypress.io
- Contact: dev-team@yaminiinfotech.com

---

**END OF TESTING GUIDE**
