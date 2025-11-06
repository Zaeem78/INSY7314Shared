# International Payment System Startup Script for Windows
Write-Host "🚀 Starting International Payment System..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js v16 or higher." -ForegroundColor Red
    exit 1
}

function Install-Dependencies {
    param(
        [string]$Directory,
        [string]$Name
    )

    $nodeModulesPath = Join-Path $Directory "node_modules"
    if (-not (Test-Path $nodeModulesPath)) {
        Write-Host "📦 Installing dependencies for $Name..." -ForegroundColor Yellow
        Push-Location $Directory
        npm install
        Pop-Location
    } else {
        Write-Host "✅ Dependencies already installed for $Name" -ForegroundColor Green
    }
}

# Install backend dependencies
Install-Dependencies "backend" "Backend API"

# Install frontend dependencies
Install-Dependencies "frontend" "Frontend App"

Write-Host ""
Write-Host "🎯 Starting servers..." -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

# Start backend
Write-Host "🔧 Starting Backend API on port 3001..." -ForegroundColor Yellow
Push-Location backend
Start-Process npm -ArgumentList "start" -NoNewWindow
Pop-Location

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend
Write-Host "🌐 Starting Frontend App on port 3000..." -ForegroundColor Yellow
Push-Location frontend
Start-Process npm -ArgumentList "start" -NoNewWindow
Pop-Location

Write-Host ""
Write-Host "🎉 International Payment System is running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 Backend API: http://localhost:3001" -ForegroundColor Magenta
Write-Host "🌐 Frontend App: http://localhost:3000" -ForegroundColor Magenta
Write-Host ""
Write-Host "Close this window or press Ctrl+C to stop both servers" -ForegroundColor Yellow

# Keep the script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host "Stopping servers..." -ForegroundColor Yellow
}
