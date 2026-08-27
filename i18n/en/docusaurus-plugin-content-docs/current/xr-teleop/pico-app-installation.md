---
title: Pico App Installation
sidebar_label: Pico App Installation
sidebar_position: 2
---

<div className="bingru-theme" />

# Pico App Installation

## Developer Mode

Developer mode and USB debugging are enabled by default from the factory. To manually configure or re-enable them, refer to the official guide: [PICO Development Environment Setup](https://developer.picoxr.com/document/android/development-environment/).

## Installation Methods

Developer mode must be enabled before installing.

### 1. ADB Push

Linux:
```bash
sudo apt update && sudo apt install adb
adb devices
adb install -r <path-to-apk>
```

Windows:
Download [SDK Platform-Tools for Windows](https://dl.google.com/android/repository/platform-tools-latest-windows.zip), extract the zip, open a terminal, and run:
```powershell
.\adb.exe devices
.\adb.exe install -r <path-to-apk>
```

macOS:
```bash
brew install android-platform-tools
adb devices
adb install -r <path-to-apk>
```

When multiple devices are connected, use `adb -s <serial> install -r <path-to-apk>`.

### 2. Third-Party File Managers

1. Connect the headset to PC via USB, and copy the APK to internal storage (such as Download folder).
2. Open the built-in file manager or a third-party file manager (such as ES File Explorer, AnExplorer) in the headset.
3. Click the APK file and allow installation from unknown sources.

### 3. PICO Developer Center

1. Open PICO Developer Center on PC and connect the headset.
2. Go to App Management, then drag and drop or select the APK to install.

## Troubleshooting

- Use a high-quality USB data cable and prefer rear motherboard USB ports.
- Ensure USB debugging authorization is accepted inside the headset.
- In case of signature or version conflicts, uninstall the existing version first.
- If the PC fails to detect the headset, restart the PC or inspect Android drivers.
