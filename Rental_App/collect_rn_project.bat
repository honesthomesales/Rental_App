@echo off
set ZIP_FILE=%cd%\Rental_App_Snapshot.zip
echo Creating snapshot: %ZIP_FILE%

:: Exclude node_modules and build artifacts
tar -cf "%ZIP_FILE%" --exclude="node_modules" --exclude="*.apk" --exclude="*.gradle" --exclude="build" *

echo Done. Upload Rental_App_Snapshot.zip into ChatGPT.
pause
