---
title: 软件与固件升级
sidebar_position: 5
---

# 软件与固件升级

## 升级前

1. 记录当前机器人控制端 / MarvinSDK、Teleop 遥操服务、Apex 前端和头显客户端版本。
2. 备份现场网络、机器人、相机和末端执行器配置。
3. 停止 Robot、Teleop、Camera 和 Tool，确保机器人处于安全状态。
4. 使用同一交付版本中的配套安装包，不混用不同发布批次。

## 控制器端

将控制器安装包放到天准控制器后，在文件所在目录执行：

```bash
sudo apt install ./<controller-package>.deb
```

## 上位机端

在上位机安装同一交付批次的 Teleop 遥操服务和 Apex 前端。当前文档基线为 Teleop 遥操服务 `1.0.18`、Marvin Pro 前端 `1.0.7.6o`：

```bash
sudo apt install ./<apex-teleop-package>.deb
```

使用 `1.0.7.6` 及之后的拆包版本且交付配置包含夹爪或其他末端执行器时，还需安装同批次的 `kernelmind-apex-tool` 配套包；仅安装控制端主包时，Robot、Camera 和 Teleop 可以运行，但 Tool 模块及对应夹爪组件可能缺失。

头显客户端安装和开发者模式操作见 [Apex XR 头显客户端](/xr-teleop/)。

## 升级后验证

1. 重新启动控制器和上位机软件。
2. 核对网络、机器人型号、相机和末端执行器配置。
3. 启动 Robot，确认 URDF 与实体姿态一致。
4. 在空载、低风险环境完成 Impedance Mode、Home 和小幅遥操测试；如果机器人处于出厂打包姿态，必须先通过 RQt MoveJ 到 14 关节全零位，禁止直接 Home。
5. 检查录制、相机和日志功能。

机器人控制器固件、伺服固件和相机固件不得自行跨版本升级，应使用技术支持确认的固件包和流程。
