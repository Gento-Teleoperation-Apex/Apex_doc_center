---
title: Pico App 安装
sidebar_label: Pico App 安装
sidebar_position: 2
---

<div className="bingru-theme" />

# Pico App 安装

## 开发者模式

出厂默认已开启开发者模式与 USB 调试。若需手动配置或重新开启，请参考官方说明：[PICO 开发环境配置文档](https://developer.picoxr.com/document/android/development-environment/)。

## 安装方式

以下方式均需开启开发者模式。

### 1. ADB 推送

Linux：
```bash
sudo apt update && sudo apt install adb
adb devices
adb install -r <apk路径>
```

Windows：
下载 [SDK Platform-Tools (Windows)](https://dl.google.com/android/repository/platform-tools-latest-windows.zip) 并解压，打开终端执行：
```powershell
.\adb.exe devices
.\adb.exe install -r <apk路径>
```

macOS：
```bash
brew install android-platform-tools
adb devices
adb install -r <apk路径>
```

多设备连接时使用 `adb -s <序列号> install -r <apk路径>`。

### 2. 第三方文件管理器

1. USB 连接电脑，将 APK 复制到头显内部存储（如 Download 目录）。
2. 在头显内打开自带文件管理器或第三方工具（如 ES 文件浏览器、AnExplorer）。
3. 点击 APK 文件并允许未知来源安装。

### 3. PICO Developer Center

1. 电脑端打开 PICO Developer Center 并连接头显。
2. 进入应用管理，拖入或选择 APK 完成安装。

## 安装问题排查

- 更换优质 USB 数据线，优先使用原生后置 USB 接口。
- 确认头显内已允许 USB 调试授权。
- 签名或版本冲突时，先卸载旧版本再安装。
- 电脑未识别设备时重启电脑或检查驱动。
