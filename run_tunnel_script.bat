@echo off
echo ========================================
echo  Starting Report System Tunnel Script
echo ========================================
echo.
echo This will run the PowerShell automation script...
echo.

:: Change to the script directory
cd /d "%~dp0"

:: Run the PowerShell script with proper execution policy
echo Running PowerShell script...
powershell -ExecutionPolicy Bypass -File "update_tunnel_and_deploy.ps1"

:: Check if PowerShell script succeeded
if %errorlevel% neq 0 (
    echo.
    echo PowerShell script encountered an error. Check the output above.
    echo.
)

:: Keep window open
echo.
echo PowerShell script finished.
echo Window will stay open - close with X button when done.
:stay_open
timeout /t 60 /nobreak >nul
goto stay_open
