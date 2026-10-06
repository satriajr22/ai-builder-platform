# AI Builder Platform - Build Guide APK

## Quick Start (5 menit)

### Windows
```bash
cd mobile
build.bat
```

### macOS/Linux
```bash
cd mobile
chmod +x build.sh
./build.sh
```

### Manual Setup
```bash
cd mobile
npm install
npm run build-apk
```

---

## Prerequisites

### 1. Install Node.js
- Download: https://nodejs.org/
- Verifikasi: `node --version` (harus v18+)

### 2. Install Expo CLI
```bash
npm install -g expo-cli
expo --version
```

### 3. Create Expo Account
- Daftar: https://expo.dev/
- Login CLI: `eas login`

---

## Build APK (2 Cara)

### ✅ Cara 1: Expo Cloud Build (Recommended)

**Keuntungan:**
- Tidak perlu Android SDK
- Build langsung dari cloud
- Lebih cepat dan reliable

**Steps:**
```bash
cd mobile
npm install
npm run build-apk
```

Setelah selesai:
- APK akan ready di Expo dashboard
- Download langsung dari: https://expo.dev/
- Install ke Android device: `adb install app.apk`

### ✅ Cara 2: Local Build (Android Studio)

**Keuntungan:**
- Kontrol penuh atas build process
- Tidak perlu internet saat build

**Prerequisites:**
- Android SDK (API 21+)
- Android Emulator atau device

**Steps:**
```bash
cd mobile
npm install
npm run android
```

---

## Folder Structure

```
mobile/
├── App.js              # Main React Native component
├── app.json           # Expo configuration
├── eas.json           # Build configuration
├── package.json       # Dependencies
├── build.sh           # Build script (Linux/Mac)
├── build.bat          # Build script (Windows)
├── setup.js           # Interactive setup
├── Makefile           # Make commands
└── assets/            # Icons & splash
    ├── icon.png
    ├── splash.png
    └── adaptive-icon.png
```

---

## Konfigurasi APK

### app.json
```json
{
  "expo": {
    "name": "AI Builder Studio",
    "slug": "ai-builder-studio",
    "version": "1.0.0",
    "android": {
      "package": "com.aibuilder.studio"
    }
  }
}
```

### eas.json
```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "aab" }
    }
  }
}
```

---

## Troubleshooting

### ❌ "eas command not found"
```bash
npm install -g eas-cli
```

### ❌ "Not logged in"
```bash
npx eas login
```

### ❌ Build fails
```bash
rm -rf node_modules
npm install
npm run build-apk
```

### ❌ APK terlalu besar
- Gunakan `--profile preview` untuk testing
- Enable Proguard/R8 untuk production

---

## Install APK

### Di Physical Device
```bash
# Download APK dari Expo dashboard
adb install app.apk
```

### Di Emulator
```bash
adb install -r app.apk
```

### Direct Share (USB)
```bash
# Hubungkan device via USB
adb devices
adb install app.apk
```

---

## Publish ke Google Play

### 1. Create Signing Key
```bash
npx eas credentials
```

### 2. Build AAB (Google Play format)
```bash
npm run build-aab
```

### 3. Upload ke Google Play Console
- Sign in: https://play.google.com/console
- Create new app
- Upload AAB file
- Fill app details
- Submit for review

---

## Performance Tips

✅ **Optimization:**
- Use `npm run build-apk` untuk testing
- Use `npm run build-aab` untuk production
- Enable ProGuard untuk minimize APK size
- Lazy load modules jika diperlukan

✅ **Testing:**
- Test di multiple devices
- Test offline mode
- Test memory leak dengan DevTools

---

## Support

- Expo Docs: https://docs.expo.dev/
- React Native: https://reactnative.dev/
- Build Issues: https://github.com/satriajr22/ai-builder-platform/issues
