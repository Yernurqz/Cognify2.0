@echo off
setlocal
echo ==========================================
echo       Cognify AI - Turbo Launcher
echo ==========================================

echo [0/4] Cleaning up ghost processes...
:: Force kill any existing Node processes to free up ports 3000 and 5173
taskkill /f /im node.exe >nul 2>&1
echo [OK] Ports cleared.

:: Check node_modules in root
if not exist "Cognify\node_modules" (
    echo [! ] node_modules missing in root. Installing...
    cd Cognify && call npm install && cd ..
)

:: Check node_modules in backend
if not exist "Cognify\backend\node_modules" (
    echo [! ] node_modules missing in backend. Installing...
    cd Cognify\backend && call npm install && cd ..\..
)

:: Check node_modules in frontend
if not exist "Cognify\frontend\node_modules" (
    echo [! ] node_modules missing in frontend. Installing...
    cd Cognify\frontend && call npm install && cd ..\..
)

echo [1/4] Syncing local database...
cd Cognify\backend
call npx prisma generate
call npx prisma db push
IF %ERRORLEVEL% NEQ 0 (
    echo [ERR] Failed to sync local database.
    pause
    exit /b %ERRORLEVEL%
)
cd ..\..

echo [2/4] Launching Backend on http://localhost:3000
start "Cognify API" cmd /k "cd /d %~dp0Cognify\backend && npm run dev"

echo [3/4] Launching Frontend on http://localhost:5173
start "Cognify WEB" cmd /k "cd /d %~dp0Cognify\frontend && npm run dev"

echo [4/4] Done.
echo [INFO] Two windows opened: API and WEB.
echo [INFO] Local SQLite mode is enabled.
