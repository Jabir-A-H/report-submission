@echo off
REM Render Build Script for Report Submission System (Windows)
REM This script handles the complete build process for deployment

echo [BUILD] Starting Report Submission System build process...

REM Step 1: Install Node.js dependencies
echo [BUILD] Installing Node.js dependencies...
npm ci
if errorlevel 1 goto error

REM Step 2: Build Tailwind CSS
echo [BUILD] Building Tailwind CSS...
npm run build-css-prod
if errorlevel 1 goto error

REM Step 3: Install Python dependencies
echo [BUILD] Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 goto error

REM Step 4: Install Playwright browsers
echo [BUILD] Installing Playwright browsers...
playwright install --with-deps chromium
if errorlevel 1 goto error

echo [BUILD] Build completed successfully!
echo [BUILD] Report Submission System is ready for deployment.
goto end

:error
echo [ERROR] Build failed!
exit /b 1

:end
