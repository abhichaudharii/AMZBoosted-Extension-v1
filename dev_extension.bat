@echo off
setlocal enabledelayedexpansion

echo [AMZBoosted] Starting Development Mode...

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [AMZBoosted] node_modules not found. Installing dependencies...
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b !errorlevel!
    )
)

echo [AMZBoosted] Starting WXT Dev Server...
call npm run dev

if !errorlevel! neq 0 (
    echo.
    echo [ERROR] Dev server stopped with exit code !errorlevel!
    pause
)
