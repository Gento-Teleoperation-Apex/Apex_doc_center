---
title: Meta Quest App Installation
sidebar_label: Meta Quest App Installation
sidebar_position: 1
---

<div className="bingru-theme" />

# Meta Quest App Installation

## Developer Mode

Developer mode is enabled by default from the factory. To manually configure or re-enable it, refer to the official guide: [Meta Developer Mode Setup](https://developers.meta.com/horizon/documentation/native/android/mobile-device-setup/#enable-developer-mode).

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

### 2. Package Installer

1. Connect the headset to PC via USB, and copy the APK to internal storage (such as Download folder).
2. Inside the headset, open the APK using Package Installer or a manager with install permissions, then confirm installation.

### 3. Third-Party File Managers

- AnExplorer VR File Manager: Browse internal storage and install APKs directly inside the headset.
- Quest Tool / Assistant: PC management utility with one-click installation support, download from [Quest Tool Download Page](https://quest.vrzwk.cn/download#client-downloads).

### 4. Meta Quest Developer Hub

Meta Quest Developer Hub supports Windows and macOS only (Linux is not supported).

1. Open Meta Quest Developer Hub on PC and connect the headset.
2. Verify the headset connection status in Device Manager.
3. Open Apps, then drag and drop the APK file into the window to install.

## Troubleshooting

If you encounter installation or connection issues, check the following items in order:

- USB cable: Try a different cable, preferably brand new (this is the number one reason for failure).
- USB port: Try a different port, preferably a rear motherboard port.
- Developer mode status: Debug mode may be bugged or need re-verification in the Meta Quest app. Toggle it off and back on again.
- Secondary accounts: Delete any secondary account on the headset, as secondary accounts cannot sideload.
- Restart headset: Restarting the headset can recover stalled system services.
- PC driver issues: Restart the PC.
- Driver repair: Windows users can install Meta Quest Link for PC to resolve driver issues.
- Factory reset: Consider a factory reset of the Quest if all other steps fail.
