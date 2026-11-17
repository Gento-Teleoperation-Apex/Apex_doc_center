---
title: VLA 概述
sidebar_position: 1
---

# VLA 视觉-语言-动作模型

VLA（Vision-Language-Action）是一类结合视觉感知、自然语言指令与机器人动作控制的端到端策略模型。给定相机画面、机器人本体状态和自然语言任务描述，模型直接输出末端执行器与夹爪的控制动作，适用于模仿学习与真机部署场景。

本章节基于 [OpenPI](https://github.com/Physical-Intelligence/openpi) 框架，说明从数据采集、数据集转换、模型训练到真机推理的完整流程。

## 适用场景

- 使用 LeRobot 格式数据集微调 PI0 / PI05 模型
- 将 Data-Processing-Tool 导出的 LeRobot v3.0 数据集转换为 OpenPI 训练所需的 v2.1 格式
- 在 Marvin Pro 等机型上部署训练好的 checkpoint，通过 WebSocket 策略服务执行语言指令任务

## 端到端流程

```text
原始采集数据（BAG / MCAP）
  -> Data-Processing-Tool 导出 LeRobot v3.0 数据集
  -> convert_v3_to_v2.py 转换为 v2.1 格式
  -> train_pytorch.py 训练 PI0 / PI05 模型
  -> serve_policy_kmd_joint.py 启动策略服务器
  -> vlahost 采集机器人状态与相机画面
  -> openpi_client_policy_http_kmd_joint.py 推理并下发动作
```

## 观测与动作格式

当前 KMD 真机部署链路使用三路相机和 16 维关节空间状态：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `state` | float32 向量 | 16 维状态：左臂 7 关节、左夹爪、右臂 7 关节、右夹爪 |
| `cam_high` | HWC uint8 | 主视角相机图像 |
| `cam_left_wrist` | HWC uint8 | 左腕相机图像 |
| `cam_right_wrist` | HWC uint8 | 右腕相机图像 |
| `prompt` | string | 自然语言任务指令 |

策略输出：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `actions` | `[T, 16]` | 关节动作 chunk，顺序与 16 维状态一致 |

模型内部使用角度制；机器人侧 `joint_states.positions` 通常使用弧度制。OpenPI 客户端会在推理前执行 `rad -> deg`，并在下发动作前执行 `deg -> rad`。

## 环境要求

- Python 3.10+
- [uv](https://github.com/astral-sh/uv) 包管理器
- OpenPI 项目根目录下执行所有命令
- 训练推荐 NVIDIA GPU；推理可在独立 GPU 服务器上运行策略服务

## 快速导航

| 文档 | 内容 |
| --- | --- |
| [数据集转换](/vla/dataset-conversion) | LeRobot v3.0 → v2.1 格式转换 |
| [数据集样例](/vla/dataset-sample) | 四路相机视频与目录结构说明 |
| [环境与项目准备](/vla/environment) | OpenPI KMD、GPU、Docker 与机器人端 vlahost 环境 |
| [模型训练](/vla/training) | PI0 / PI05 微调与 checkpoint 管理 |
| [真机部署](/vla/deployment) | 策略服务器与机器人客户端联调 |
