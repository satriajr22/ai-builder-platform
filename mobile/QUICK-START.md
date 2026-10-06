# 🚀 Quick Start - Build APK dalam 5 Menit

## Langkah 1: Install Node.js

1. Download: https://nodejs.org/
2. Install dan restart terminal
3. Verifikasi:
   ```bash
   node --version
   npm --version
   ```

## Langkah 2: Setup Expo Account

1. Daftar gratis: https://expo.dev/
2. Login:
   ```bash
   npx eas login
   ```

## Langkah 3: Install Dependencies

```bash
cd mobile
npm install
```

## Langkah 4: Build APK

### Opsi A: Automatic Script (Paling Mudah)

**Windows:**
```bash
build.bat
```

**macOS/Linux:**
```bash
chmod +x build.sh
./build.sh
```

### Opsi B: Manual Command

```bash
npm run build-apk
```

## Langkah 5: Download APK

1. Tunggu build selesai (biasanya 5-10 menit)
2. Cek status: https://expo.dev/
3. Download APK file
4. Transfer ke Android phone
5. Tap untuk install

---

## Alternatif: Test Lokal Sebelum Build

```bash
npm start
```

Lalu:
- **Android Emulator:** Tekan `a`
- **Physical Device:** Scan QR code dengan Expo Go app

---

## 📱 Install APK Manual

Jika punya file APK:

```bash
# Copy APK ke device
adb install path/to/app.apk
```

---

## ✅ Selesai!

App sudah siap digunakan. Fitur utama:

- ✨ AI prompt generator
- 🎨 Real-time workflow status
- 🔗 Preview & Publish
- 📊 Project dashboard
- 🌙 Dark theme default

---

## Troubleshooting Cepat

| Error | Solusi |
|-------|--------|
| `eas not found` | `npm install -g eas-cli` |
| `Not logged in` | `npx eas login` |
| `Build failed` | `npm run build-apk` ulangi |
| `Connection timeout` | Check internet, coba lagi |
| `APK won't install` | Uninstall versi lama dulu |

---

## Docs Lengkap

- 📖 Detailed Guide: [BUILDING.md](BUILDING.md)
- 🎯 Features: [README-MOBILE.md](README-MOBILE.md)
- ⚙️ Config: [app.json](app.json), [eas.json](eas.json)

---

**Questions?** Open issue di repo atau check [Expo Docs](https://docs.expo.dev/)
