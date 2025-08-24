@echo off
echo Building Rental App for GitHub Pages deployment...

echo.
echo 1. Installing root dependencies...
call npm install

echo.
echo 2. Building API package...
cd packages\api
call npm install
call npm run build
cd ..\..

echo.
echo 3. Installing web dependencies...
cd apps\web
call npm install

echo.
echo 4. Building web app for static export...
set NODE_ENV=production
call npm run build:no-lint

echo.
echo 5. Checking build output...
if exist out (
    echo SUCCESS: Static export created in apps\web\out
    echo.
    echo Build complete! The app is ready for GitHub Pages deployment.
    echo The 'out' directory contains the static files.
) else (
    echo ERROR: Build failed - 'out' directory not found
    echo Please check the build logs above for errors.
)

cd ..\..
pause
