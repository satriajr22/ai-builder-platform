#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function setup() {
  console.log('\n================================');
  console.log('AI Builder Platform - Setup');
  console.log('================================\n');

  // Check Node.js
  exec('node --version', (error, stdout) => {
    if (error) {
      console.log('❌ Node.js belum terinstall');
      console.log('Download: https://nodejs.org/');
      process.exit(1);
    }
    console.log('✅ Node.js ditemukan:', stdout.trim());
  });

  // Setup options
  console.log('\n📱 Pilih setup option:');
  console.log('1. Install dependencies');
  console.log('2. Build APK (via Expo Cloud)');
  console.log('3. Run development server');
  console.log('4. Full setup (install + config)\n');

  const choice = await question('Pilih (1-4): ');

  switch (choice) {
    case '1':
      console.log('\n📦 Installing npm dependencies...');
      exec('npm install', (error, stdout, stderr) => {
        if (error) {
          console.log('❌ Install gagal:', error.message);
          process.exit(1);
        }
        console.log('✅ Dependencies installed');
        console.log('\nNext: npm run build-apk');
        rl.close();
      });
      break;

    case '2':
      console.log('\n🔨 Building APK via Expo Cloud...');
      console.log('⚠️  Pastikan sudah login dengan: npx eas login');
      exec('npx eas build --platform android --profile preview', (error, stdout, stderr) => {
        if (error) {
          console.log('❌ Build gagal:', error.message);
          process.exit(1);
        }
        console.log('✅ Build submitted to Expo');
        console.log('Check status: https://expo.dev/');
        rl.close();
      });
      break;

    case '3':
      console.log('\n🚀 Starting Expo development server...');
      exec('npx expo start', (error, stdout, stderr) => {
        if (error) {
          console.log('❌ Server gagal:', error.message);
          process.exit(1);
        }
      });
      break;

    case '4':
      console.log('\n⚙️  Melakukan setup lengkap...');
      console.log('1️⃣  Menginstall dependencies...');

      // Create .env file
      const envPath = path.join(__dirname, '.env.local');
      if (!fs.existsSync(envPath)) {
        const apiUrl = await question('API URL (default: http://192.168.1.100:3000): ');
        const envContent = `API_BASE_URL=${apiUrl || 'http://192.168.1.100:3000'}\n`;
        fs.writeFileSync(envPath, envContent);
        console.log('✅ .env.local created');
      }

      console.log('\n2️⃣  Installing packages...');
      exec('npm install', (error) => {
        if (error) {
          console.log('❌ Install gagal');
          process.exit(1);
        }
        console.log('✅ Setup complete!');
        console.log('\nNext steps:');
        console.log('- Run: npm start');
        console.log('- Or: npm run build-apk');
        console.log('- Or: npm run build-aab');
        rl.close();
      });
      break;

    default:
      console.log('❌ Pilihan tidak valid');
      rl.close();
      process.exit(1);
  }
}

setup().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});
