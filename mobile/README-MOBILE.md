# AI Builder Platform - Android APK

Mobile version built with React Native + Expo

## Prerequisites

- Node.js >= 18
- Expo CLI: `npm install -g expo-cli`
- Android SDK or Expo account

## Quick Start (Local Development)

```bash
cd mobile
npm install
npm start
```

Then:
- Press `a` to open Android emulator
- Or scan QR code with Expo Go app on physical device

## Build APK

### Option 1: Using Expo Cloud Build (Recommended)

1. Create Expo account: https://expo.dev
2. Login with CLI:
   ```bash
   eas login
   ```

3. Build APK:
   ```bash
   npm run build-apk
   ```

4. Download APK from Expo dashboard

### Option 2: Local Build (Android Studio)

```bash
npm run android
```

Requires Android SDK and emulator setup.

## Configuration

Edit `App.js` to change API base URL:

```javascript
const API_BASE_URL = 'http://YOUR_SERVER:3000';
```

For production, replace with your backend URL.

## Features

✅ Prompt-based project generation
✅ Real-time workflow status
✅ Live logs and error tracking
✅ Preview and publish workflow
✅ Responsive mobile UI
✅ Dark theme optimized

## Deploy

### Publish to Google Play Store

1. Build AAB (Android App Bundle):
   ```bash
   npm run build-aab
   ```

2. Upload to Google Play Console
3. Configure app details, pricing, and distribution
4. Submit for review

## Troubleshooting

**APK not installing?**
- Clear cache: `adb shell pm clear com.aibuilder.studio`
- Reinstall: `adb uninstall com.aibuilder.studio`

**Can't connect to backend?**
- Use `adb reverse tcp:3000 tcp:3000` to expose local server
- Or deploy backend to cloud server

**Build fails?**
- Clear cache: `rm -rf .expo node_modules`
- Reinstall: `npm install`

## Notes

- APK is automatically signed for testing
- For production, create app signing key
- Android min SDK: API 21 (Android 5.0)
