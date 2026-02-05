@echo off
setlocal

REM Run from the folder where this .bat lives
cd /d "%~dp0"

IF NOT EXIST "node_modules" (
  echo Installing dependencies...
  npm install
  IF ERRORLEVEL 1 (
    echo.
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo Starting app (dev mode) in a new window...
start "Weather Tracker" /D "%~dp0" cmd /k npm run dev

set "URL=http://localhost:3000"
set "HEALTH=%URL%/api/health"

echo Waiting for server to be ready...
set /a "TRIES=0"
:wait_for_server
set /a "TRIES+=1"
if %TRIES% GTR 60 (
  echo.
  echo Timed out waiting for server. You can try opening %URL% manually.
  pause
  exit /b 1
)

powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 -Uri '%HEALTH%'; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
if errorlevel 1 (
  timeout /t 1 /nobreak >nul
  goto wait_for_server
)

echo Opening %URL% ...
start "" "%URL%"
