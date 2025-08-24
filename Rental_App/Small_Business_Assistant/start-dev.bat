@echo off
echo Starting Small Business Assistant development environment...

echo Starting API server...
start "API Server" cmd /k "cd packages\api && npm run dev"

timeout /t 2 /nobreak >nul

echo Starting Web server...
start "Web Server" cmd /k "cd packages\web && npm run dev"

timeout /t 2 /nobreak >nul

echo Starting Mobile server...
start "Mobile Server" cmd /k "cd packages\mobile && npm start"

echo All development servers started!
echo API: http://localhost:3001
echo Web: http://localhost:5173
echo Mobile: Expo development server should be running

pause 