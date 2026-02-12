@echo off
REM =====================================================
REM Yamini Infotech ERP - Database Export/Import
REM =====================================================

echo.
echo ========================================
echo   Database Management Script
echo ========================================
echo.
echo 1. Export database (backup)
echo 2. Import database (restore)
echo 3. Create new database
echo 4. Exit
echo.
set /p choice="Enter choice (1-4): "

if "%choice%"=="1" goto export
if "%choice%"=="2" goto import
if "%choice%"=="3" goto create
if "%choice%"=="4" exit /b

:export
echo.
set /p filename="Enter backup filename (default: yamini_backup.sql): "
if "%filename%"=="" set filename=yamini_backup.sql
echo [INFO] Exporting database to %filename%...
pg_dump -U postgres -d yamini_infotech > %filename%
if %errorlevel%==0 (
    echo [OK] Database exported successfully to %filename%
) else (
    echo [ERROR] Export failed. Make sure PostgreSQL is installed and running.
)
pause
goto end

:import
echo.
set /p filename="Enter backup filename to import: "
if "%filename%"=="" (
    echo [ERROR] Filename required
    pause
    goto end
)
if not exist "%filename%" (
    echo [ERROR] File not found: %filename%
    pause
    goto end
)
echo [WARNING] This will overwrite existing data!
set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" goto end
echo [INFO] Importing database from %filename%...
psql -U postgres -d yamini_infotech < %filename%
if %errorlevel%==0 (
    echo [OK] Database imported successfully
) else (
    echo [ERROR] Import failed
)
pause
goto end

:create
echo.
echo [INFO] Creating new database 'yamini_infotech'...
psql -U postgres -c "CREATE DATABASE yamini_infotech;"
if %errorlevel%==0 (
    echo [OK] Database created successfully
    echo [INFO] Tables will be created automatically when you start the backend
) else (
    echo [WARNING] Database may already exist or PostgreSQL is not running
)
pause
goto end

:end
