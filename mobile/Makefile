.PHONY: install build-apk build-aab start setup clean help

help:
	@echo "AI Builder Platform - Mobile Commands"
	@echo ""
	@echo "Usage:"
	@echo "  make install    - Install npm dependencies"
	@echo "  make start      - Run development server (Expo)"
	@echo "  make build-apk  - Build APK for testing"
	@echo "  make build-aab  - Build AAB for production"
	@echo "  make setup      - Interactive setup wizard"
	@echo "  make clean      - Remove build artifacts"

install:
	@echo "📦 Installing dependencies..."
	npm install
	@echo "✅ Done"

start:
	@echo "🚀 Starting development server..."
	npx expo start

build-apk:
	@echo "🔨 Building APK for testing..."
	npm install
	npx eas build --platform android --profile preview

build-aab:
	@echo "🔨 Building AAB for production..."
	npm install
	npx eas build --platform android --profile production

setup:
	@echo "⚙️  Running setup wizard..."
	node setup.js

clean:
	@echo "🧹 Cleaning up..."
	rm -rf node_modules dist .expo .expo-shared
	@echo "✅ Clean complete"
