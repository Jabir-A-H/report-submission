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

:: Pause to see any final messages
echo.
echo PowerShell script finished.
pause
