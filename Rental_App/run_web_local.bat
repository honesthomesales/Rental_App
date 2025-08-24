@echo off
echo Starting Rental App Web Development Server...
echo.
echo Make sure you have the following environment variables set:
echo - NEXT_PUBLIC_SUPABASE_URL
echo - NEXT_PUBLIC_SUPABASE_ANON_KEY
echo.
echo You can copy these from env.example
echo.
cd apps/web
echo Installing dependencies...
npm install
echo.
echo Starting development server...
npm run dev
pause
