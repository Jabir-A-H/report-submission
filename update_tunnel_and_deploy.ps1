#Requires -Version 5.1

<#
.SYNOPSIS
    Report System Tunnel Update Script - PowerShell Version
    
.DESCRIPTION
    Automates the process of starting Flask app, creating Cloudflare tunnel,
    updating index.html with new URLs, and pushing changes to GitHub.
    
.EXAMPLE
    .\update_tunnel_and_deploy.ps1
#>

param(
    [string]$ProjectPath = "f:\WebDev\report-submission",
    [int]$MaxRetries = 30,
    [int]$RetryDelay = 2
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Global variables for cleanup
$FlaskProcess = $null
$TunnelProcess = $null
$TempFiles = @()

function Write-Header {
    param([string]$Title)
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " $Title" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Red
}

function Cleanup {
    Write-Host ""
    Write-Host "Cleaning up..." -ForegroundColor Yellow
    
    # Stop processes
    if ($TunnelProcess -and !$TunnelProcess.HasExited) {
        try {
            $TunnelProcess.Kill()
            $TunnelProcess.WaitForExit(5000)
            Write-Host "Tunnel process stopped" -ForegroundColor Green
        }
        catch {
            Write-Warning "Failed to stop tunnel process: $($_.Exception.Message)"
        }
    }
    
    if ($FlaskProcess -and !$FlaskProcess.HasExited) {
        try {
            $FlaskProcess.Kill()
            $FlaskProcess.WaitForExit(5000)
            Write-Host "Flask process stopped" -ForegroundColor Green
        }
        catch {
            Write-Warning "Failed to stop Flask process: $($_.Exception.Message)"
        }
    }
    
    # Kill any remaining processes
    try {
        Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force
        Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*app.py*" } | Stop-Process -Force
    }
    catch {
        Write-Warning "Error stopping remaining processes: $($_.Exception.Message)"
    }
    
    # Clean up temporary files
    foreach ($file in $TempFiles) {
        if (Test-Path $file) {
            try {
                Remove-Item $file -Force
                Write-Host "Removed temp file: $file" -ForegroundColor Green
            }
            catch {
                Write-Warning "Failed to remove temp file $file`: $($_.Exception.Message)"
            }
        }
    }
}

function Test-Prerequisites {
    Write-Host "Checking prerequisites..." -ForegroundColor Yellow
    
    # Check if we're in the right directory
    if (!(Test-Path $ProjectPath)) {
        throw "Project directory not found: $ProjectPath"
    }
    
    Set-Location $ProjectPath
    
    # Check if it's a git repository
    if (!(Test-Path ".git")) {
        throw "Not a git repository. Please initialize git first."
    }
    
    # Check if Flask app exists
    if (!(Test-Path "app.py")) {
        throw "app.py not found in project directory."
    }
    
    # Check if Python is available
    try {
        $pythonVersion = python --version 2>&1
        Write-Host "Python found: $pythonVersion" -ForegroundColor Green
    }
    catch {
        throw "Python not found in PATH. Please install Python."
    }
    
    # Check if cloudflared is available
    try {
        $cloudflaredVersion = cloudflared --version 2>&1
        Write-Host "Cloudflared found: $cloudflaredVersion" -ForegroundColor Green
    }
    catch {
        throw "Cloudflared not found in PATH. Please install Cloudflare tunnel."
    }
    
    # Check if git is available
    try {
        $gitVersion = git --version 2>&1
        Write-Host "Git found: $gitVersion" -ForegroundColor Green
    }
    catch {
        throw "Git not found in PATH. Please install Git."
    }
    
    Write-Success "All prerequisites satisfied!"
}

function Start-FlaskApp {
    Write-Host "Starting Flask application..." -ForegroundColor Yellow
    
    $flaskOutputFile = Join-Path $ProjectPath "flask_output.txt"
    $TempFiles += $flaskOutputFile
    
    # Start Flask app
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = "python"
    $processInfo.Arguments = "app.py"
    $processInfo.WorkingDirectory = $ProjectPath
    $processInfo.UseShellExecute = $false
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    $processInfo.CreateNoWindow = $true
    
    $global:FlaskProcess = New-Object System.Diagnostics.Process
    $global:FlaskProcess.StartInfo = $processInfo
    
    # Redirect output to file
    $global:FlaskProcess.Add_OutputDataReceived({
        if ($EventArgs.Data) {
            $EventArgs.Data | Out-File -FilePath $flaskOutputFile -Append -Encoding UTF8
        }
    })
    
    $global:FlaskProcess.Add_ErrorDataReceived({
        if ($EventArgs.Data) {
            $EventArgs.Data | Out-File -FilePath $flaskOutputFile -Append -Encoding UTF8
        }
    })
    
    $global:FlaskProcess.Start()
    $global:FlaskProcess.BeginOutputReadLine()
    $global:FlaskProcess.BeginErrorReadLine()
    
    Write-Host "Flask process started (PID: $($global:FlaskProcess.Id))" -ForegroundColor Green
    
    # Wait for Flask to start
    Write-Host "Waiting for Flask to start on port 5000..." -ForegroundColor Yellow
    $retryCount = 0
    $maxFlaskRetries = 10
    
    do {
        Start-Sleep -Seconds 1
        $retryCount++
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5000" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Success "Flask app is running and responding on port 5000!"
                return
            }
        }
        catch {
            # Flask might not be ready yet
        }
        
        Write-Host "Waiting for Flask... ($retryCount/$maxFlaskRetries)" -ForegroundColor Yellow
    } while ($retryCount -lt $maxFlaskRetries)
    
    # Check if process is still running
    if ($global:FlaskProcess.HasExited) {
        $exitCode = $global:FlaskProcess.ExitCode
        throw "Flask process exited with code $exitCode. Check flask_output.txt for errors."
    }
    
    Write-Warning "Flask might not be fully ready, but process is running. Continuing..."
}

function Start-CloudflareTunnel {
    Write-Host "Starting Cloudflare tunnel..." -ForegroundColor Yellow
    
    $tunnelOutputFile = Join-Path $ProjectPath "tunnel_output.txt"
    $TempFiles += $tunnelOutputFile
    
    # Start cloudflared tunnel
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = "cloudflared"
    $processInfo.Arguments = "tunnel --url http://localhost:5000"
    $processInfo.WorkingDirectory = $ProjectPath
    $processInfo.UseShellExecute = $false
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    $processInfo.CreateNoWindow = $true
    
    $global:TunnelProcess = New-Object System.Diagnostics.Process
    $global:TunnelProcess.StartInfo = $processInfo
    
    # Capture output to file
    $outputData = @()
    $global:TunnelProcess.Add_OutputDataReceived({
        if ($EventArgs.Data) {
            $EventArgs.Data | Out-File -FilePath $tunnelOutputFile -Append -Encoding UTF8
            $script:outputData += $EventArgs.Data
        }
    })
    
    $global:TunnelProcess.Add_ErrorDataReceived({
        if ($EventArgs.Data) {
            $EventArgs.Data | Out-File -FilePath $tunnelOutputFile -Append -Encoding UTF8
            $script:outputData += $EventArgs.Data
        }
    })
    
    $global:TunnelProcess.Start()
    $global:TunnelProcess.BeginOutputReadLine()
    $global:TunnelProcess.BeginErrorReadLine()
    
    Write-Host "Tunnel process started (PID: $($global:TunnelProcess.Id))" -ForegroundColor Green
    
    # Wait for tunnel URL
    Write-Host "Waiting for tunnel URL..." -ForegroundColor Yellow
    $retryCount = 0
    $tunnelUrl = $null
    
    do {
        Start-Sleep -Seconds $RetryDelay
        $retryCount++
        
        # Read tunnel output file
        if (Test-Path $tunnelOutputFile) {
            $content = Get-Content $tunnelOutputFile -Raw -ErrorAction SilentlyContinue
            if ($content) {
                # Extract tunnel URL using regex
                $urlMatch = [regex]::Match($content, 'https://[a-zA-Z0-9-]+\.trycloudflare\.com')
                if ($urlMatch.Success) {
                    $tunnelUrl = $urlMatch.Value
                    break
                }
            }
        }
        
        Write-Host "Waiting for tunnel URL... ($retryCount/$MaxRetries)" -ForegroundColor Yellow
        
        # Check if tunnel process is still running
        if ($global:TunnelProcess.HasExited) {
            $exitCode = $global:TunnelProcess.ExitCode
            throw "Tunnel process exited with code $exitCode. Check tunnel_output.txt for errors."
        }
        
    } while ($retryCount -lt $MaxRetries)
    
    if (!$tunnelUrl) {
        throw "Timeout waiting for tunnel URL after $MaxRetries attempts"
    }
    
    Write-Success "Tunnel URL detected: $tunnelUrl"
    return $tunnelUrl
}

function Update-IndexHtml {
    param([string]$TunnelUrl)
    
    Write-Host "Updating index.html with new tunnel URLs..." -ForegroundColor Yellow
    
    $indexPath = Join-Path $ProjectPath "index.html"
    if (!(Test-Path $indexPath)) {
        throw "index.html not found in project directory"
    }
    
    # Read current content
    $content = Get-Content $indexPath -Raw -Encoding UTF8
    
    # Create new URLs
    $appUrl = "$TunnelUrl/"
    $registerUrl = "$TunnelUrl/register"
    
    # Replace old URLs with new ones
    $content = $content -replace 'href="https://[^"]*\.trycloudflare\.com/"', "href=`"$appUrl`""
    $content = $content -replace 'href="https://[^"]*\.trycloudflare\.com/register"', "href=`"$registerUrl`""
    
    # Write updated content back
    $content | Set-Content $indexPath -NoNewline -Encoding UTF8
    
    Write-Success "Successfully updated index.html with new tunnel URLs:"
    Write-Host "App URL: $appUrl" -ForegroundColor Yellow
    Write-Host "Register URL: $registerUrl" -ForegroundColor Yellow
}

function Push-ToGithub {
    param([string]$TunnelUrl)
    
    Write-Host "Pushing changes to GitHub..." -ForegroundColor Yellow
    
    # Check git status
    Write-Host "Checking git status..." -ForegroundColor Yellow
    git status
    
    # Add index.html
    Write-Host "Adding index.html to git..." -ForegroundColor Yellow
    git add index.html
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to add index.html to git"
    }
    
    # Commit changes
    $commitMessage = "Update tunnel URLs in index.html - $TunnelUrl"
    Write-Host "Committing changes..." -ForegroundColor Yellow
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to commit changes"
    }
    
    # Push to GitHub
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    git push origin main
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to push to GitHub"
    }
    
    Write-Success "Successfully pushed changes to GitHub!"
}

function Show-Results {
    param([string]$TunnelUrl)
    
    Write-Header "SUCCESS: Deployment completed!"
    
    Write-Host "Flask App: Running on localhost:5000" -ForegroundColor Green
    Write-Host "New tunnel URL: $TunnelUrl" -ForegroundColor Green
    Write-Host "App URL: $TunnelUrl/" -ForegroundColor Yellow
    Write-Host "Register URL: $TunnelUrl/register" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "The index.html file has been updated with new URLs and pushed to GitHub." -ForegroundColor Green
    Write-Host "Your Flask app and tunnel are running in the background." -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Keep this PowerShell window open to maintain the app and the tunnel!" -ForegroundColor Red
    Write-Host "Press any key to continue running, or close this window to stop everything." -ForegroundColor Yellow
}

# Main execution
try {
    Write-Header "Report System Tunnel Update Script"
    
    # Set up cleanup on exit
    Register-EngineEvent PowerShell.Exiting -Action { Cleanup }
    
    # Test prerequisites
    Test-Prerequisites
    
    # Start Flask app
    Start-FlaskApp
    
    # Start Cloudflare tunnel and get URL
    $tunnelUrl = Start-CloudflareTunnel
    
    # Update HTML file
    Update-IndexHtml -TunnelUrl $tunnelUrl
    
    # Push to GitHub
    Push-ToGithub -TunnelUrl $tunnelUrl
    
    # Show results
    Show-Results -TunnelUrl $tunnelUrl
    
    # Wait for user input to keep processes running
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the following files for more details:" -ForegroundColor Yellow
    if (Test-Path "flask_output.txt") {
        Write-Host "- flask_output.txt (Flask app logs)" -ForegroundColor Yellow
    }
    if (Test-Path "tunnel_output.txt") {
        Write-Host "- tunnel_output.txt (Tunnel logs)" -ForegroundColor Yellow
    }
}
finally {
    Cleanup
    Write-Host ""
    Write-Host "Script completed. All processes stopped." -ForegroundColor Green
    Write-Host "Press any key to exit..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
