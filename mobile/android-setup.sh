#!/bin/bash

# AI Builder Platform - Android SDK Setup
# Ini akan menginstall Android SDK dan tools yang diperlukan

echo "================================"
echo "Android SDK Auto Setup"
echo "================================"
echo ""

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Detected macOS"
    
    # Install Homebrew if not installed
    if ! command -v brew &> /dev/null; then
        echo "📦 Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    # Install Android SDK
    echo "📱 Installing Android SDK..."
    brew install android-sdk
    brew install android-platform-tools
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Detected Linux"
    
    # Install Java
    echo "☕ Installing Java..."
    sudo apt-get update
    sudo apt-get install -y openjdk-11-jdk
    
    # Install Android SDK
    echo "📱 Installing Android SDK..."
    sudo apt-get install -y android-sdk
    
else
    echo "❌ Unsupported OS"
    exit 1
fi

echo ""
echo "✅ Android SDK setup complete!"
echo "Next: set ANDROID_HOME environment variable"
echo ""
echo "Add to ~/.bashrc or ~/.zshrc:"
echo "export ANDROID_HOME=~/Android/Sdk"
echo "export PATH=\$ANDROID_HOME/tools:\$ANDROID_HOME/platform-tools:\$PATH"
