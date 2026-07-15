---
title: 经典版界面
sidebar_position: 3
---

# 经典版 Apex Teleop

本页适用于 Marvin Pro 历史 Orin 版本以及当前 Skye/Luna。不同交付批次的按钮文字可能略有差异，以现场配套软件为准。

![经典版 Apex Teleop 标注界面](/img/gento/luna/apex_teleop_overview_annotated.jpg)

## 连接与启动

1. 在右上角填写控制器实际 IP，按 Enter 连接。
2. 启动 **Robot**，确认 3D 模型与实体机器人姿态一致。
3. 按产品快速入门要求启动 **Teleop** 和网络模块；Camera 可按需启动。
4. 点击 **Start Robot** 或界面中的机器人启动入口。
5. 进入 **Impedance Mode**，然后执行 **Home**。
6. 连接头显并进入遥操。

Skye/Luna 使用 Pico 头显及全身追踪组件；Marvin Pro 历史版本按实际交付使用 Pico 或 Meta Quest。

## 主要区域

| 区域 | 说明 |
|---|---|
| 状态栏 | 显示 Robot、Camera、Teleop、Net、VR 和 Healthy 状态 |
| 3D Viewer | 显示机器人实时关节姿态 |
| Module Control | 启动、停止或重启 Camera、Robot、Teleop 等模块 |
| Robot Mode | 启动机器人、切换 Standby/Position/Impedance，并执行 Home |
| Data Record | 输入任务名并开始或停止录制 |
| Data Playback | 选择记录文件，播放或停止回放 |
| WebRTC | 连接并查看相机视频 |
| Log | 选择模块并查看运行日志 |

## 数据录制与回放

录制前确认数据盘和 Camera 状态。填写录制名称后点击 **Start Recording**，任务完成后点击 **Stop Recording**。回放时选择记录文件，再使用 **Play**、**Stop** 和循环选项。

实机回放具有运动风险，操作前应确认机器人起始姿态、工作空间和急停状态。

## 日志

从左侧导航进入日志页，在模块列表中选择 Robot、Teleop、Camera 或网络服务。出现模块无法启动、VR 无法连接或相机黑屏时，应记录时间并保存对应日志信息。
