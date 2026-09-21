---
title: 软件与固件升级
sidebar_position: 5
---

# 软件与固件升级

## 升级前

1. 记录当前 `gento-apex`、Gento SDK、Teleop 遥操服务、Apex 前端和头显客户端版本。
2. 备份现场网络、机器人、相机和末端执行器配置。
3. 停止 Robot、Teleop、Camera 和 Tool，确保机器人处于安全状态。
4. 使用同一交付版本中的配套安装包，不混用不同发布批次。

## 控制器端

当前 Pro 源码核对目标为 `gento-apex 1.1.7.1`，使用 Gento SDK `4.7.1`；该目标在源码中仍标记为未正式发布。只有交付清单或技术支持明确指定该版本时，才将同一交付批次的安装包放到天准控制器，并先安装 SDK、再安装 Apex：

```bash
sudo apt install ./gento-sdk_4.7.1_arm64_ubuntu22.04.deb
sudo apt install ./pro-Teleoperation-apex_v1.1.7.1o_humble_arm64.deb
```

安装包文件名使用 `pro-Teleoperation-apex`，安装后的 Debian 包名仍为 `gento-apex`。上方命令展示 `1.1.7.1` 的目标命名格式，并不表示该版本已经正式发布；带 `_testN` 后缀的文件是测试制品，仅在技术支持明确指定时使用。

## 上位机端

在上位机安装同一交付批次的 Teleop 遥操服务和 Apex 前端：

```bash
sudo apt install ./<apex-teleop-package>.deb
```

交付配置包含夹爪或其他末端执行器时，还需安装交付清单指定的 Tool 包。当前 Pro 源码随控制端构建的 `gento-apex-tool` 严格依赖同版本的 `gento-apex`，不得跨版本混装；单独交付的末端驱动软件可能采用自己的版本线，以对应末端执行器的交付说明为准。仅安装控制端主包时，Robot、Camera 和 Teleop 可以运行，但 Tool 模块及对应末端组件可能缺失。

头显客户端安装和开发者模式操作见 [Apex XR 头显客户端](/xr-teleop/)。

## 升级后验证

1. 重新启动控制器和上位机软件。
2. 核对网络、机器人型号、相机和末端执行器配置。
3. 启动 Robot，确认 URDF 与实体姿态一致。
4. 在空载、低风险环境完成 Impedance Mode、Home 和小幅遥操测试；如果机器人处于出厂打包姿态，必须先在 Robot Ready 后开启拖动模式，手动移到标准零位姿态并关闭拖动模式，禁止直接 Home。
5. 检查录制、相机和日志功能。

机器人控制器固件、伺服固件和相机固件不得自行跨版本升级，应使用技术支持确认的固件包和流程。
