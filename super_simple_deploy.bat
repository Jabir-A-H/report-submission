@echo off
title Report System - Hybrid Deploy
echo ========================================
echo  Report System - Hybrid Deployment
echo ========================================
echo.
echo This script will:
echo 1. Start Flask app with venv (batch)
echo 2. Start Cloudflare tunnel (batch)
echo 3. Extract URL and update files (PowerShell)
echo 4. Push to GitHub (PowerShell)
echo.

:: Change to project directory
cd /d "f:\WebDev\report-submission"

:: Check if we're in the right place
if not exist "app.py" (
    echo Error: app.py not found. Make sure you're in the right directory.
    pause
    exit /b 1
)
del tunnel_output.txt

:: Activate virtual environment and start Flask in background
echo Step 1: Starting Flask app with virtual environment...
start /min "Flask App" cmd /c "venv\Scripts\activate && python app.py"

:: Wait for Flask to start
echo Waiting 8 seconds for Flask to start...
timeout /t 8 /nobreak >nul

:: Test if Flask is running
echo Testing Flask connection...
curl -s http://localhost:5000 >nul
if errorlevel 1 (
    echo Warning: Flask might not be ready yet. Continuing anyway...
) else (
    echo Flask is responding!
)

echo.
echo Step 2: Starting Cloudflare tunnel and capturing output...
echo This will take a moment...

:: Start tunnel in background and capture output
start /b cmd /c "cloudflared tunnel --url http://localhost:5000 > tunnel_output.txt 2>&1"

:: Wait for tunnel to establish
echo Waiting 10 seconds for tunnel to establish...
timeout /t 10 /nobreak >nul

echo.
echo Step 3: Running PowerShell to extract URL and update files...
powershell -ExecutionPolicy Bypass -File "update_files_only.ps1"

if %errorlevel% neq 0 (
    echo.
    echo PowerShell script encountered an error.
    echo Check tunnel_output.txt for tunnel details.
    echo.
)

echo.
echo ========================================
echo Deployment process completed!
echo ========================================
echo.
echo Flask app and tunnel are running in the background.
echo Close this window with X button to keep them running.
echo.

:stay_open
timeout /t 60 /nobreak >nul
goto stay_open
