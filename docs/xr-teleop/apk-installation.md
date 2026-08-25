---
title: APK 安装与升级
sidebar_label: APK 安装
sidebar_position: 1
---

# 头显 APK 安装与升级

本页适用于 Pico 和 Meta Quest 头显。拿到交付的 APK 后，请先确认安装包对应当前头显型号，并与控制器端 Teleop 遥操服务属于同一交付批次。

:::warning 安装前确认

- Pico 与 Meta Quest 使用各自对应的 APK，不要交叉安装。
- 升级前记录当前 APK、Teleop 和 Apex 版本，以及客户端中的 Host IP、端口和其他现场配置。
- 使用能够传输数据的 USB 线。仅支持充电的线缆无法建立 ADB 连接。
- 安装期间机器人应停止遥操并保持安全状态。

:::

## 1. 准备 ADB

Ubuntu 可通过以下命令安装 Android Debug Bridge：

```bash
sudo apt update
sudo apt install adb
adb version
```

Windows 请解压 Android SDK Platform-Tools，在该文件夹打开 PowerShell。后续命令中的 `adb` 可写为 `./adb.exe`。

## 2. 启用 USB 调试

1. 按头显厂商要求为设备开启系统开发者模式和 USB 调试。
2. 打开头显并保持解锁，通过 USB 数据线连接电脑。
3. 头显内出现“允许 USB 调试”提示时选择允许；固定维护电脑可勾选“始终允许”。
4. 在电脑执行：

```bash
adb kill-server
adb start-server
adb devices
```

正常时设备序列号后的状态应为 `device`：

```text
List of devices attached
<SERIAL>    device
```

| 状态 | 处理方法 |
|---|---|
| `unauthorized` | 戴上头显并允许 USB 调试，然后重新执行 `adb devices` |
| 没有设备 | 更换 USB 数据线或接口，确认头显已解锁并启用 USB 调试 |
| 多台设备 | 后续命令增加 `-s <SERIAL>` 指定目标头显 |

## 3. 安装 APK

进入 APK 所在目录，使用收到的实际文件名替换示例：

```bash
cd ~/Downloads
adb install -r "./<HEADSET_APK_FILE>.apk"
```

安装成功会显示：

```text
Success
```

连接多台 Android 设备时：

```bash
adb -s <SERIAL> install -r "./<HEADSET_APK_FILE>.apk"
```

`-r` 会在签名和应用包名一致时覆盖升级，并尽量保留原有应用数据。不要在文件名中直接输入示例尖括号。

## 4. 无法覆盖升级时

若出现 `INSTALL_FAILED_UPDATE_INCOMPATIBLE`、签名不一致或版本降级错误，先记录客户端配置，再从头显的应用管理中卸载旧版 Apex Teleop，然后重新安装：

```bash
adb install "./<HEADSET_APK_FILE>.apk"
```

卸载应用会清除其 Host IP、端口和其他本地设置。除非已经确认实际 Android 包名，否则不要照抄网上的 `adb uninstall` 命令。

若出现 `INSTALL_FAILED_VERSION_DOWNGRADE`，优先向交付人员确认是否拿错版本；确需回退时应先卸载当前版本，再安装已确认的回退包。

## 5. 在头显中打开并验证

1. 断开安装用 USB 数据线，按现场接线要求恢复头显有线网络。
2. 在头显的应用库、未知来源或企业应用列表中打开 Apex Teleop。
3. 首次启动时允许应用申请的必要权限，并完成边界、安全和隐私提示。
4. 恢复交付配置中的 Host IP。天准和灵境 Thor 当前默认连接地址均为 `6.6.7.100`，现场修改过网络时以交付参数为准。
5. 保持两个手柄或所需追踪器在线，确认客户端版本、网络连接、视频和追踪状态正常。
6. 在机器人周围清场后，从小幅动作开始验证遥操。

安装完成后继续阅读对应操作手册：

- [Pico 用户手册](./pico.md)
- [Meta Quest 用户手册](./meta.md)

## 6. 安装失败时需要提供的信息

向技术支持提供以下信息，避免只发送“安装失败”：

```bash
adb devices
adb install -r "./<HEADSET_APK_FILE>.apk"
```

同时提供头显型号、系统版本、APK 完整文件名、Teleop/Apex 版本、终端完整报错和头显提示截图。请勿在机器人运动过程中反复安装或切换 APK。
