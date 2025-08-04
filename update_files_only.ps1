# Simple PowerShell script that only handles URL extraction and git operations
param(
    [string]$ProjectPath = "f:\WebDev\report-submission"
)

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

# Set location
Set-Location $ProjectPath

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " URL Extraction and Git Update" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if tunnel output file exists
$tunnelOutputFile = "tunnel_output.txt"
if (!(Test-Path $tunnelOutputFile)) {
    Write-Error "tunnel_output.txt not found. Make sure tunnel is running."
    exit 1
}

# Wait and retry for URL extraction
Write-Host "Extracting tunnel URL from output..." -ForegroundColor Yellow
$tunnelUrl = $null
$retryCount = 0
$maxRetries = 20

do {
    Start-Sleep -Seconds 2
    $retryCount++
    
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
    
    Write-Host "Looking for tunnel URL... ($retryCount/$maxRetries)" -ForegroundColor Yellow
} while ($retryCount -lt $maxRetries)

if (!$tunnelUrl) {
    Write-Error "Could not extract tunnel URL after $maxRetries attempts"
    Write-Host "Check tunnel_output.txt manually:" -ForegroundColor Yellow
    if (Test-Path $tunnelOutputFile) {
        Get-Content $tunnelOutputFile
    }
    exit 1
}

Write-Success "Tunnel URL found: $tunnelUrl"

# Update index.html
Write-Host "Updating index.html..." -ForegroundColor Yellow
$indexPath = "index.html"

if (!(Test-Path $indexPath)) {
    Write-Error "index.html not found"
    exit 1
}

# Read and update content
$content = Get-Content $indexPath -Raw -Encoding UTF8
$appUrl = "$tunnelUrl/"
$registerUrl = "$tunnelUrl/register"

# Replace URLs
$content = $content -replace 'href="https://[^"]*\.trycloudflare\.com/"', "href=`"$appUrl`""
$content = $content -replace 'href="https://[^"]*\.trycloudflare\.com/register"', "href=`"$registerUrl`""

# Write back
$content | Set-Content $indexPath -NoNewline -Encoding UTF8

Write-Success "index.html updated with:"
Write-Host "  App URL: $appUrl" -ForegroundColor Yellow
Write-Host "  Register URL: $registerUrl" -ForegroundColor Yellow

# Git operations
Write-Host "Performing git operations..." -ForegroundColor Yellow

try {
    # Check git status
    git status
    
    # Add index.html
    git add index.html
    if ($LASTEXITCODE -ne 0) { throw "git add failed" }
    
    # Commit
    $commitMessage = "Update tunnel URLs - $tunnelUrl"
    git commit -m $commitMessage
    if ($LASTEXITCODE -ne 0) { throw "git commit failed" }
    
    # Push
    git push origin main
    if ($LASTEXITCODE -ne 0) { throw "git push failed" }
    
    Write-Success "Successfully pushed changes to GitHub!"
}
catch {
    Write-Error "Git operation failed: $_"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Update completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your landing page is now live at: $tunnelUrl" -ForegroundColor Yellow
Write-Host "Flask app and tunnel are still running in the background." -ForegroundColor Green

# Clean up tunnel output file
if (Test-Path $tunnelOutputFile) {
    Remove-Item $tunnelOutputFile -Force
}
