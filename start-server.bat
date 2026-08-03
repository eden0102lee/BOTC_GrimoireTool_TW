@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

title Clocktower Grimoire TW - Local Server
echo.
echo  ========================================
echo   Clocktower Grimoire TW - One-click start
echo  ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found.
  echo Install from: https://nodejs.org/
  echo.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm not found.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo [INFO] First run: installing dependencies...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
  echo.
)

echo [INFO] Starting HTTP :8080 and WebSocket :8081 ...
echo [INFO] Browser will open when ready.
echo [INFO] In this window: restart / rebuild / help / quit
echo [INFO] Close this window or press Ctrl+C to stop.
echo.

call npm start
set EXITCODE=%ERRORLEVEL%

echo.
if %EXITCODE% neq 0 (
  echo [DONE] Start failed, exit code %EXITCODE%.
) else (
  echo [DONE] Server stopped.
)
echo.
pause
exit /b %EXITCODE%
