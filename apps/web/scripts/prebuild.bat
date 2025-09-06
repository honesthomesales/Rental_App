@echo off
if exist app\api (
    move app\api api-temp
    echo Moved API routes to temp directory
) else (
    echo API directory not found
)
