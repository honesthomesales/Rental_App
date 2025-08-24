# PowerShell script to check development services status

Write-Host "Checking Small Business Assistant development services..." -ForegroundColor Green

# Check API server (port 3001)
try {
    $apiResponse = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ API Server: Running (http://localhost:3001)" -ForegroundColor Green
} catch {
    Write-Host "❌ API Server: Not responding (http://localhost:3001)" -ForegroundColor Red
}

# Check Web server (port 5174 - Vite auto-assigned)
try {
    $webResponse = Invoke-WebRequest -Uri "http://localhost:5174" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Web Server: Running (http://localhost:5174)" -ForegroundColor Green
} catch {
    try {
        $webResponse = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ Web Server: Running (http://localhost:5173)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Web Server: Not responding (ports 5173/5174)" -ForegroundColor Red
    }
}

# Check if Metro bundler is running (port 8081)
try {
    $metroResponse = Invoke-WebRequest -Uri "http://localhost:8081" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Metro Bundler: Running (http://localhost:8081)" -ForegroundColor Green
} catch {
    Write-Host "❌ Metro Bundler: Not responding (http://localhost:8081)" -ForegroundColor Red
}

Write-Host "`nService Status Summary:" -ForegroundColor Cyan
Write-Host "• API: http://localhost:3001" -ForegroundColor White
Write-Host "• Web: http://localhost:5174 (or 5173)" -ForegroundColor White
Write-Host "• Mobile: Metro bundler on port 8081" -ForegroundColor White 