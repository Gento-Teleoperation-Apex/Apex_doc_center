---
title: 软件与固件升级
sidebar_position: 5
---

# 软件与固件升级

## 升级前

1. 记录当前控制器端、Apex Teleop 和头显客户端版本。
2. 备份现场网络、机器人、相机和末端执行器配置。
3. 停止 Robot、Teleop、Camera 和 Tool，确保机器人处于安全状态。
4. 使用同一交付版本中的配套安装包，不混用不同发布批次。

## 控制器端

将控制器安装包放到天准控制器后，在文件所在目录执行：

```bash
sudo apt install ./<controller-package>.deb
```

## 上位机端

在上位机安装配套 Apex Teleop：

```bash
sudo apt install ./<apex-teleop-package>.deb
```

头显客户端安装和开发者模式操作见 [Apex XR 头显客户端](/xr-teleop/)。

## 升级后验证

1. 重新启动控制器和上位机软件。
2. 核对网络、机器人型号、相机和末端执行器配置。
3. 启动 Robot，确认 URDF 与实体姿态一致。
4. 在空载、低风险环境完成 Impedance Mode、Home 和小幅遥操测试。
5. 检查录制、相机和日志功能。

机器人控制器固件、伺服固件和相机固件不得自行跨版本升级，应使用技术支持确认的固件包和流程。
