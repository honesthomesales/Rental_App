@echo off
setlocal EnableDelayedExpansion

echo.
echo ==== VALIDATING MONOREPO AND ANDROID CONFIGURATION ====
echo.

set "ANDROID_PATH=apps\android\android"
set "CONFIG_FILE=react-native.config.js"
set "RENTAL_APP_ANDROID=Rental_App_Android"

:: 1. Check Android path exists
if exist "%ANDROID_PATH%" (
    echo ✅ Android folder found at: %ANDROID_PATH%
) else (
    echo ❌ ERROR: Android folder not found at expected location: %ANDROID_PATH%
)

:: 2. Check key Android files
if exist "%ANDROID_PATH%\settings.gradle" (
    echo ✅ Found: settings.gradle
) else (
    echo ❌ ERROR: settings.gradle missing in %ANDROID_PATH%
)

if exist "%ANDROID_PATH%\app\build.gradle" (
    echo ✅ Found: app/build.gradle
) else (
    echo ❌ ERROR: build.gradle missing in app/
)

if exist "%ANDROID_PATH%\app\src\main\java\com\*.MainApplication.kt" (
    echo ✅ Found: MainApplication.kt
) else (
    echo ⚠️ WARNING: MainApplication.kt not found
)

:: 3. Check react-native.config.js for correct sourceDir
if exist "%CONFIG_FILE%" (
    findstr /C:"sourceDir: './apps/android/android'" "%CONFIG_FILE%" >nul
    if %errorlevel%==0 (
        echo ✅ sourceDir correctly set in %CONFIG_FILE%
    ) else (
        echo ❌ ERROR: Incorrect or missing sourceDir in %CONFIG_FILE%
    )
) else (
    echo ❌ ERROR: %CONFIG_FILE% not found
)

:: 4. Warn if old folder exists
if exist "%RENTAL_APP_ANDROID%" (
    echo ⚠️ WARNING: Legacy folder still exists: %RENTAL_APP_ANDROID%
    echo     You should delete it if you're now using apps/android/
)

echo.
echo ==== VALIDATION COMPLETE ====
echo.

pause
