@echo off
REM AI Builder Platform - APK Build Script (Windows)
REM Otomatis build APK tanpa perlu setup manual

echo ================================
echo AI Builder Platform - APK Builder
echo ================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js belum terinstall
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js ditemukan: 
node --version

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm belum terinstall
    pause
    exit /b 1
)

echo ✅ npm ditemukan:
npm --version

echo.
echo 📦 Installing dependencies...
cd mobile
npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm install gagal
    pause
    exit /b 1
)

echo ✅ Dependencies installed

echo.
echo 📱 Building APK...
echo Pilih opsi:
echo 1. Build APK (Testing)
echo 2. Build AAB (Production)
echo 3. Local Development
echo.
set /p choice="Pilih (1-3): "

if "%choice%"=="1" (
    echo 🔨 Building APK Preview...
    npx eas build --platform android --profile preview
) else if "%choice%"=="2" (
    echo 🔨 Building AAB Production...
    npx eas build --platform android --profile production
) else if "%choice%"=="3" (
    echo 🚀 Starting Expo Development Server...
    npx expo start
) else (
    echo ❌ Pilihan tidak valid
    pause
    exit /b 1
)

echo.
echo ✅ Build complete!
pause
