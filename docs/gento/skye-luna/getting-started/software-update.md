---
title: 软件与固件升级
sidebar_position: 5
---

# 软件与固件升级

升级前记录天准003、经典版 Apex Teleop 和 Pico 客户端版本，备份网络、机型、相机和追踪配置，并确保机器人安全停机。

```bash
sudo apt install ./<controller-package>.deb
```

控制器端、上位机端和 Pico 客户端必须使用同一交付批次的配套版本。升级后依次验证 Robot、3D 姿态、相机、Pico 连接、Home、双臂和膝关节小幅动作。

Pico 安装与开发者模式见 [Pico 头显操作说明](/xr-teleop/pico)。机器人控制器、伺服和追踪组件固件不得自行跨版本升级。
