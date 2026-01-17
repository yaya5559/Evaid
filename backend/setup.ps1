# Chatgpt helped me wrtie the script for quick setup
# Evaide Backend Setup Script for Windows
# Run this to install everything needed

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Evaide Backend Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "[1/4] Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  Found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Python not found!" -ForegroundColor Red
    Write-Host "  Install from: https://python.org" -ForegroundColor Yellow
    exit 1
}

# Check/Install ODBC Driver
Write-Host ""
Write-Host "[2/4] Checking ODBC Driver..." -ForegroundColor Yellow
$hasODBC = Get-OdbcDriver -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*ODBC Driver 18*" -or $_.Name -like "*ODBC Driver 17*" }

if ($hasODBC) {
    Write-Host "  ODBC Driver already installed" -ForegroundColor Green
} else {
    Write-Host "  Installing ODBC Driver 18..." -ForegroundColor Yellow
    
    $url = "https://go.microsoft.com/fwlink/?linkid=2249004"
    $installer = "$env:TEMP\msodbcsql.msi"
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $installer -UseBasicParsing
        Start-Process msiexec.exe -Wait -ArgumentList "/i `"$installer`" /quiet /norestart IACCEPTMSODBCSQLLICENSETERMS=YES"
        Remove-Item $installer -Force
        Write-Host "  ODBC Driver installed!" -ForegroundColor Green
    } catch {
        Write-Host "  Auto-install failed. Please install manually:" -ForegroundColor Yellow
        Write-Host "  https://go.microsoft.com/fwlink/?linkid=2249004" -ForegroundColor Cyan
        pause
    }
}

# Create virtual environment
Write-Host ""
Write-Host "[3/4] Setting up virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "  venv already exists" -ForegroundColor Yellow
} else {
    python -m venv venv
    Write-Host "  Created venv" -ForegroundColor Green
}

# Install packages
Write-Host ""
Write-Host "[4/4] Installing Python packages..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1
pip install -r requirements.txt --quiet --upgrade
Write-Host "  All packages installed!" -ForegroundColor Green

# Done
Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start the server:" -ForegroundColor Cyan
Write-Host "  1. Make sure you have the .env file" -ForegroundColor White
Write-Host "  2. Run: uvicorn main:app --reload" -ForegroundColor White
Write-Host ""
Write-Host "Then open: http://127.0.0.1:8000/docs" -ForegroundColor Cyan