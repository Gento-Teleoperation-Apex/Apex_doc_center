---
title: 使用说明
sidebar_position: 1
---

# Apex Teleop 使用说明

Apex 上位机软件用于连接机器人控制器、管理遥操模块、切换控制模式、查看相机画面，以及录制、回放和排查运行日志。交付软件由机器人控制端、Teleop 遥操服务和前端界面组成，三者版本号含义不同。

| 软件层 | 当前文档基线 | 作用 |
|---|---|---|
| 机器人控制端 / MarvinSDK | `100343001` | 建立机器人控制链路 |
| Teleop 遥操服务 | `1.0.18` | 处理遥操数据和控制链路 |
| Marvin Pro 前端 | `1.0.7.6o` | 上位机界面 |
| Gento 前端 | `1.0.6.81g` | Skye/Luna 上位机界面；带 `g` 的版本属于 Gento 产品线 |

版本会持续更新，以上编号用于说明当前文档基线，现场应使用同一交付批次的配套软件。

## 版本适用范围

| 产品 | 使用界面 | 说明 |
|---|---|---|
| Marvin Pro（当前天准版本） | [当前版界面](/software/apex-teleop/pro-current) | 本文档以前端 `1.0.7.6o` 对应界面为例 |
| Marvin Pro（历史 Orin 版本） | [经典版界面](/software/apex-teleop/classic) | 面向已出货历史设备 |
| Skye / Luna | [经典版界面](/software/apex-teleop/classic) | 当前文档以 Gento 前端 `1.0.6.81g` 为基线 |

## 文档导航

- [Marvin Pro 当前版界面与操作](/software/apex-teleop/pro-current)
- [Marvin Pro 历史版与 Skye/Luna 经典界面](/software/apex-teleop/classic)
- [Marvin Pro 客户二次开发接口](/software/apex-teleop/customer-interfaces)
- [Gento（Skye/Luna）ROS 2 接口](/software/apex-teleop/gento-interfaces)
- [Pico 头显操作说明](/xr-teleop/pico)
- [Meta Quest 头显操作说明](/xr-teleop/meta)

> Marvin Pro 支持 Pico 和 Meta Quest；Skye/Luna 的全身遥操使用 Pico 头显及腰部、腿部追踪组件。
