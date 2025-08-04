@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  Report System Tunnel Update Script
echo ========================================
echo.

:: Change to the project directory
cd /d "f:\WebDev\report-submission"

:: Check if we're in a git repository
if not exist ".git" (
    echo Error: Not a git repository. Please initialize git first.
    pause
    exit /b 1
)

:: Check if Flask app exists
if not exist "app.py" (
    echo Error: app.py not found in current directory.
    pause
    exit /b 1
)

echo Starting Flask application...
echo.

:: Start Flask app in background
echo Starting Flask app on localhost:5000...
start /b cmd /c "python app.py > flask_output.txt 2>&1"

:: Wait for Flask to start
timeout /t 5 /nobreak >nul

:: Check if Flask is running
netstat -an | findstr ":5000" >nul
if errorlevel 1 (
    echo Warning: Flask app might not be running on port 5000
    echo Check flask_output.txt for errors if tunnel fails
    echo.
)

echo Starting Cloudflare tunnel...
echo.

:: Start cloudflared tunnel in background and capture output
echo Starting tunnel... Please wait...
start /b cmd /c "cloudflared tunnel --url http://localhost:5000 > tunnel_output.txt 2>&1"

:: Wait a moment for tunnel to start
timeout /t 10 /nobreak >nul

:: Wait for tunnel URL to appear in output file
set "tunnel_url="
set "retry_count=0"
set "max_retries=30"

:wait_for_url
if !retry_count! geq !max_retries! (
    echo Error: Timeout waiting for tunnel URL
    goto cleanup
)

if exist "tunnel_output.txt" (
    for /f "tokens=*" %%a in ('findstr "https://.*\.trycloudflare\.com" tunnel_output.txt') do (
        set "line=%%a"
        for /f "tokens=*" %%b in ('echo !line! ^| findstr /r "https://[a-zA-Z0-9-]*\.trycloudflare\.com"') do (
            for /f "tokens=2" %%c in ("%%b") do (
                set "tunnel_url=%%c"
            )
        )
    )
)

if "!tunnel_url!"=="" (
    set /a retry_count+=1
    echo Waiting for tunnel URL... (!retry_count!/!max_retries!)
    timeout /t 2 /nobreak >nul
    goto wait_for_url
)

echo.
echo Tunnel URL detected: !tunnel_url!
echo.

:: Create a temporary PowerShell script to update the HTML file
echo Creating update script...

(
echo $tunnelUrl = "!tunnel_url!"
echo $loginUrl = $tunnelUrl + "/login"
echo $registerUrl = $tunnelUrl + "/register"
echo.
echo # Check if index.html exists
echo if ^(-not ^(Test-Path "index.html"^)^) {
echo     Write-Error "index.html not found!"
echo     exit 1
echo }
echo.
echo # Read the current index.html file
echo $content = Get-Content "index.html" -Raw -Encoding UTF8
echo.
echo # Replace the old URLs with new ones using regex
echo $content = $content -replace 'href="https://[^"]*\.trycloudflare\.com/login"', "href=`"$loginUrl`""
echo $content = $content -replace 'href="https://[^"]*\.trycloudflare\.com/register"', "href=`"$registerUrl`""
echo.
echo # Write the updated content back to the file
echo $content ^| Set-Content "index.html" -NoNewline -Encoding UTF8
echo.
echo Write-Host "Successfully updated index.html with new tunnel URLs:" -ForegroundColor Green
echo Write-Host "Login: $loginUrl" -ForegroundColor Yellow
echo Write-Host "Register: $registerUrl" -ForegroundColor Yellow
) > update_html.ps1

:: Run the PowerShell script
echo Updating index.html with new tunnel URLs...
powershell -ExecutionPolicy Bypass -File "update_html.ps1"

if !errorlevel! neq 0 (
    echo Error: Failed to update index.html
    goto cleanup
)

echo.
echo File updated successfully!
echo.

:: Git operations
echo Checking git status...
git status

echo.
echo Adding index.html to git...
git add index.html

echo.
echo Committing changes...
git commit -m "Update tunnel URLs in index.html - !tunnel_url!"

if !errorlevel! neq 0 (
    echo Error: Git commit failed
    goto cleanup
)

echo.
echo Pushing to GitHub...
git push origin main

if !errorlevel! neq 0 (
    echo Error: Git push failed
    goto cleanup
)

echo.
echo ========================================
echo SUCCESS: Deployment completed!
echo ========================================
echo.
echo Flask App: Running on localhost:5000
echo New tunnel URL: !tunnel_url!
echo Login URL: !tunnel_url!/login
echo Register URL: !tunnel_url!/register
echo.
echo The index.html file has been updated with new URLs and pushed to GitHub.
echo Your Flask app and tunnel are running in the background.
echo.
echo IMPORTANT: Keep this window open to maintain the app and the tunnel!
echo Press any key to continue running, or close this window to stop everything.
pause >nul

:cleanup
:: Clean up temporary files
if exist "update_html.ps1" del "update_html.ps1"
if exist "tunnel_output.txt" del "tunnel_output.txt"
if exist "flask_output.txt" del "flask_output.txt"

:: Kill the tunnel and Flask processes when script ends
echo.
echo Stopping tunnel and Flask app...
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq cloudflared.exe" /fo csv ^| find "cloudflared.exe"') do (
    taskkill /pid %%a /f >nul 2>&1
)

for /f "tokens=2" %%a in ('tasklist /fi "imagename eq python.exe" /fo csv ^| find "python.exe"') do (
    taskkill /pid %%a /f >nul 2>&1
)

echo.
echo Script completed. All processes stopped.
pause
