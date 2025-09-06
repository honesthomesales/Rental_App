@echo off
if exist api-temp (
    move api-temp app\api
    echo Restored API routes from temp directory
) else (
    echo API temp directory not found
)
