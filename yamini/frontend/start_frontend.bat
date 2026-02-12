@echo off
REM =====================================================
REM Yamini Infotech ERP - Frontend Setup & Start
REM =====================================================
echo.
echo ========================================
echo   Yamini Infotech ERP - Frontend Setup
echo ========================================
echo.

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found

cd /d "%~dp0"
echo [INFO] Working directory: %CD%

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies already installed
)

echo.
echo [INFO] Starting development server...
echo [INFO] Frontend: http://localhost:5173
echo [INFO] Press Ctrl+C to stop
echo.
npm run dev
