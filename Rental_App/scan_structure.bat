@echo off
setlocal enabledelayedexpansion

set "TARGET=C:\Projects\Rental_App"
set "OUTPUT=%TARGET%\folder_structure.txt"

echo Scanning folder structure under: %TARGET%
echo Output will be saved to: %OUTPUT%

if exist "%OUTPUT%" del "%OUTPUT%"

echo Folder structure of %TARGET% > "%OUTPUT%"
echo. >> "%OUTPUT%"
tree "%TARGET%" /F >> "%OUTPUT%"

echo Done.
pause
@echo off
setlocal enabledelayedexpansion

set "TARGET=C:\Projects\Rental_App"
set "OUTPUT=%TARGET%\folder_structure.txt"

echo Scanning folder structure under: %TARGET%
echo Output will be saved to: %OUTPUT%

if exist "%OUTPUT%" del "%OUTPUT%"

echo Folder structure of %TARGET% > "%OUTPUT%"
echo. >> "%OUTPUT%"
tree "%TARGET%" /F >> "%OUTPUT%"

echo Done.
pause
