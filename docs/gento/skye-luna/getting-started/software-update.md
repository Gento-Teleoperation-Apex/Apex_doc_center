---
title: 软件与固件升级
sidebar_position: 5
---

# 软件与固件升级

升级前记录天准003控制端、Teleop 遥操服务、Apex 前端和 Pico 客户端版本，备份网络、机型、相机和追踪配置，并确保机器人安全停机。

```bash
sudo apt install ./<controller-package-from-delivery-manifest>.deb
```

Skye/Luna 必须使用带 `g` 或 `gento` 标识的 Gento 配套控制端安装包，不得安装 Marvin Pro 的无 `g` 包。

当前正式文档基线为 `v1.1.7.1g`，使用 Gento SDK `4.7.1`，但不代表所有客户设备均已安装该版本。控制器端、Teleop 遥操服务、Apex 前端和 Pico 客户端必须使用同一交付批次的配套版本。升级后依次验证 Robot、3D 姿态、相机、Pico 连接和 Home，再按机型验证 Skye 的双臂/BODY/LIFT 或 Luna 的双臂/BODY 小幅动作。

新版配套界面的配置校验、保存、应用及应用后检查见 [Gento 当前版操作指南](/software/apex-teleop/gento-current)。升级基线包不等于获得 DAgger；该功能需另外核对交付清单并完成 [DAgger 联调与验收](/vla/dagger#10-api-速查与验收清单)。

Pico 安装与开发者模式见 [Pico 头显操作说明](/xr-teleop/pico)。机器人控制器、伺服和追踪组件固件不得自行跨版本升级。
