---
title: Meta Quest App 安装
sidebar_label: Meta Quest App 安装
sidebar_position: 1
---

<div className="bingru-theme" />

# Meta Quest App 安装

## 开发者模式

出厂默认已开启开发者模式。若需手动配置或重新开启，请参考官方说明：[Meta 开发者模式设置说明](https://developers.meta.com/horizon/documentation/native/android/mobile-device-setup/#enable-developer-mode)。

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

### 2. Package Installer

1. USB 连接电脑，将 APK 复制到头显内部存储（如 Download 目录）。
2. 在头显内通过 Package Installer 或具备安装权限的管理器打开 APK 并确认安装。

### 3. 第三方文件管理器

- AnExplorer VR File Manager：在头显内直接浏览存储并安装 APK。
- Quest 助手：电脑端管理工具，提供一键安装，下载地址：[Quest 助手客户端下载页](https://quest.vrzwk.cn/download#client-downloads)。

### 4. Meta Quest Developer Hub

Meta Quest Developer Hub 仅支持 Windows 与 macOS，不支持 Linux。

1. 电脑打开 Meta Quest Developer Hub 并连接头显。
2. 在 Device Manager 确认设备在线。
3. 进入 Apps 页面，将 APK 拖入窗口完成安装。

## 安装问题排查

遇到安装或连接问题，请按以下顺序检查：

- USB 线缆：更换其他数据线，首选全新线缆（连接失败的首要原因）。
- USB 接口：更换其他接口，优先使用主板后置接口。
- 开发者模式失效：在 Meta Horizon 手机应用中将开发者模式关闭后重新开启。
- 副账号限制：删除头显中的所有副账号，副账号无法侧载应用。
- 重启头显：重启头显恢复系统服务。
- 电脑驱动异常：重启电脑。
- 驱动修复：Windows 用户可安装 Meta Quest Link 电脑客户端修复驱动。
- 恢复出厂设置：排查无效后考虑恢复出厂设置。
