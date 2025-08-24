# PowerShell script to start the development environment
# This avoids the cd command issues in PowerShell

Write-Host "Starting Small Business Assistant development environment..." -ForegroundColor Green

# Start the API server
Write-Host "Starting API server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd packages/api; npm run dev" -WindowStyle Normal

# Wait a moment for the API to start
Start-Sleep -Seconds 2

# Start the web server
Write-Host "Starting Web server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd packages/web; npm run dev" -WindowStyle Normal

# Wait a moment for the web to start
Start-Sleep -Seconds 2

# Start the mobile server
Write-Host "Starting Mobile server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd packages/mobile; npm start" -WindowStyle Normal

Write-Host "All development servers started!" -ForegroundColor Green
Write-Host "API: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Web: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Mobile: Expo development server should be running" -ForegroundColor Cyan 