@echo off
REM Start both the backend server and Vite dev server
REM This ensures the app works with picture uploads

cd /d "%~dp0"

echo Starting TTRPG Character Builder...
echo.
echo This will start:
echo 1. Backend server on http://localhost:3001
echo 2. Vite dev server on http://localhost:5173
echo.

npm run dev:full

pause

