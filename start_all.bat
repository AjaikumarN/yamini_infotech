@echo off
REM =====================================================
REM Yamini Infotech ERP - Start All Services
REM =====================================================
echo.
echo ========================================
echo   Starting All ERP Services
echo ========================================
echo.

REM Start Backend in new window
echo [INFO] Starting Backend Server...
start "ERP Backend" cmd /c "cd /d %~dp0yamini\backend && call venv\Scripts\activate.bat && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

REM Start Frontend in new window
echo [INFO] Starting Frontend Server...
start "ERP Frontend" cmd /c "cd /d %~dp0yamini\frontend && npm run dev"

echo.
echo ========================================
echo   Services Starting...
echo ========================================
echo.
echo Backend API:  http://localhost:8000
echo API Docs:     http://localhost:8000/docs
echo Frontend:     http://localhost:5173
echo.
echo Close this window or press any key to continue...
pause >nul
