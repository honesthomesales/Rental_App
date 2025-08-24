@echo off
setlocal enabledelayedexpansion

echo 🔍 Checking for nested Rental_App folder...
if exist "Rental_App" (
    echo ✅ Found nested Rental_App folder.
    cd Rental_App

    echo 📂 Moving all files and folders up one level...

    for /f "delims=" %%i in ('dir /a /b') do (
        if /i "%%i" neq "." if /i "%%i" neq ".." (
            echo Moving %%i ...
            move "%%i" ..\ >nul 2>&1
        )
    )

    cd ..
    echo 🗑 Removing empty nested Rental_App folder...
    rmdir /s /q Rental_App

    echo 🎉 Flatten complete. Your repo should now be in %cd%
) else (
    echo ⚠️ No nested Rental_App folder found here: %cd%
)

echo Done.
pause
