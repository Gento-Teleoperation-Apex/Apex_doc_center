---
title: VLA 概述
sidebar_position: 1
---

# VLA 视觉-语言-动作模型

VLA（Vision-Language-Action）是一类结合视觉感知、自然语言指令与机器人动作控制的端到端策略模型。给定相机画面、机器人本体状态和自然语言任务描述，模型直接输出末端执行器与夹爪的控制动作，适用于模仿学习与真机部署场景。

本章节基于 [OpenPI](https://github.com/Physical-Intelligence/openpi) 框架，说明从数据采集、数据集转换、模型训练到真机推理的完整流程。

## 适用场景

- 使用 LeRobot 格式数据集微调 PI0 / PI05 模型
- 将 KM Data Converter 导出的 LeRobot v3.0 数据集转换为 OpenPI 训练所需的 v2.1 格式
- 在 Marvin Pro 等机型上部署训练好的 checkpoint，通过 WebSocket 策略服务执行语言指令任务

## 端到端流程

```text
原始采集数据（BAG / MCAP）
  -> KM Data Converter 导出 LeRobot v3.0 数据集
  -> convert_v3_to_v2.py 转换为 v2.1 格式
  -> train_pytorch.py 训练 PI0 / PI05 模型
  -> serve_policy 启动策略服务器
  -> Openpi_client_policy 连接真机执行动作
```

## 观测与动作格式

策略服务器期望的观测输入：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `observation/state` | float32 向量 | 机器人本体状态，例如 8 维 EEF 位姿 + 夹爪 |
| `observation/image` | HWC uint8 | 主相机图像，建议 224×224 或 256×256 |
| `observation/wrist_image` | HWC uint8 | 腕部相机图像 |
| `prompt` | string | 自然语言任务指令 |

策略输出：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `actions` | `[T, action_dim]` | 动作序列 chunk，例如 `[T, 7]` 表示 EEF 增量 + 夹爪 |

动作向量典型含义（7 维）：

```text
actions = [delta_pos(3), delta_rot(3), gripper(1)]
```

- `delta_pos`：末端执行器位置增量
- `delta_rot`：末端执行器姿态增量（轴角表示）
- `gripper`：夹爪开合（0 = 打开，1 = 关闭）

## 环境要求

- Python 3.10+
- [uv](https://github.com/astral-sh/uv) 包管理器
- OpenPI 项目根目录下执行所有命令
- 训练推荐 NVIDIA GPU；推理可在独立 GPU 服务器上运行策略服务

## 快速导航

| 文档 | 内容 |
| --- | --- |
| [数据集转换](/vla/getting-started/dataset-conversion) | LeRobot v3.0 → v2.1 格式转换 |
| [数据集样例](/vla/getting-started/dataset-sample) | 四路相机视频与目录结构说明 |
| [模型训练](/vla/getting-started/training) | PI0 / PI05 微调与 checkpoint 管理 |
| [真机部署](/vla/getting-started/deployment) | 策略服务器与机器人客户端联调 |
