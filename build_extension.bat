@echo off
setlocal enabledelayedexpansion

echo [AMZBoosted] Starting Build Process...

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

echo [AMZBoosted] Building extension...
call npm run build

if !errorlevel! equ 0 (
    echo.
    echo [SUCCESS] Extension built successfully!
    echo [INFO] You can now load the 'output/chrome-mv3' folder in Chrome.
    echo.
) else (
    echo.
    echo [ERROR] Build failed with exit code !errorlevel!
    echo.
)

pause
