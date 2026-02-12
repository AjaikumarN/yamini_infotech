@echo off
REM =====================================================
REM Yamini Infotech ERP - Start Backend Server
REM =====================================================
echo.
echo Starting Yamini Infotech ERP Backend...
echo.

cd /d "%~dp0"

REM Activate virtual environment
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [ERROR] Virtual environment not found. Run setup_windows.bat first.
    pause
    exit /b 1
)

REM Start server
echo [INFO] Starting FastAPI server on http://localhost:8000
echo [INFO] API Docs: http://localhost:8000/docs
echo [INFO] Press Ctrl+C to stop
echo.
uvicorn main:app --reload --host 0.0.0.0 --port 8000
