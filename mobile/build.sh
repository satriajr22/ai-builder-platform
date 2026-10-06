#!/bin/bash

# AI Builder Platform - APK Build Script
# Otomatis build APK tanpa perlu setup manual

echo "================================"
echo "AI Builder Platform - APK Builder"
echo "================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js belum terinstall"
    echo "Download: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js ditemukan: $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm belum terinstall"
    exit 1
fi

echo "✅ npm ditemukan: $(npm -v)"

# Navigate to mobile directory
cd mobile || exit 1

echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install gagal"
    exit 1
fi

echo "✅ Dependencies installed"

echo ""
echo "📱 Building APK..."
echo "Pilih opsi:"
echo "1. Build APK (Testing)"
echo "2. Build AAB (Production)"
echo "3. Local Development"
read -p "Pilih (1-3): " choice

case $choice in
    1)
        echo "🔨 Building APK Preview..."
        npx eas build --platform android --profile preview
        ;;
    2)
        echo "🔨 Building AAB Production..."
        npx eas build --platform android --profile production
        ;;
    3)
        echo "🚀 Starting Expo Development Server..."
        npx expo start
        ;;
    *)
        echo "❌ Pilihan tidak valid"
        exit 1
        ;;
esac

echo ""
echo "✅ Build complete!"
