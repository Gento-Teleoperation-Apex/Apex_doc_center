---
title: 环境与项目准备
sidebar_position: 4
---

# OpenPI 环境与项目准备

KMD 的 VLA 部署由两个项目组成：

| 项目 | 安装位置 | 作用 |
| --- | --- | --- |
| `openpi-kmd` | GPU 训练/推理服务器 | 训练模型、加载 checkpoint、运行策略服务器和真机推理客户端 |
| `vlahost` | 机器人 ROS 2 主机 | 将 ROS 2 状态与相机话题转换为 HTTP 接口，并接收模型动作 |

## 1. 获取项目

在 GPU 服务器下载 OpenPI KMD：

```bash
git clone https://github.com/KLMmotion/openpi-kmd.git
cd openpi-kmd
```

在机器人端下载 vlahost：

```bash
git clone https://github.com/KLMmotion/vlahost.git
```

建议记录部署时使用的 commit，后续更新代码、模型或文档时按同一版本复现。

## 2. 安装 openpi-kmd

`openpi-kmd` 要求 Python 3.11 及以上，并使用 `uv` 管理环境。安装依赖：

```bash
cd openpi-kmd
uv sync
```

`uv sync` 会按照项目的 `pyproject.toml` 和 `uv.lock` 创建环境。后续命令应通过 `uv run` 执行，避免误用系统 Python：

```bash
uv run python --version
```

项目包含的主要入口：

| 文件 | 用途 |
| --- | --- |
| `scripts/train_pytorch.py` | PyTorch 模型训练 |
| `scripts/train.py` | JAX / Flax 模型训练 |
| `scripts/compute_norm_stats.py` | 计算状态与动作归一化统计 |
| `scripts/serve_policy_kmd_joint.py` | 加载 KMD 16 维关节空间 checkpoint 并启动策略服务器 |
| `vla_helpers/openpi_client_policy_http_kmd_joint.py` | 读取 vlahost 状态、调用策略并下发动作 |
| `vla_helpers/openpi_policy_shared.py` | KMD 策略共用的数据处理逻辑 |

## 3. GPU 环境检查

训练和策略服务器需要 NVIDIA GPU。同步环境后先确认 PyTorch 和 JAX 能识别 GPU：

```bash
uv run python -c "import torch; print(torch.cuda.is_available(), torch.cuda.device_count())"
uv run python -c "import jax; print(jax.devices())"
```

如果输出中没有 GPU，请先检查显卡驱动、CUDA 兼容性和当前用户权限，再开始训练或部署。

## 4. Docker 方式（可选）

项目也提供 Docker 配置。该方式有助于隔离依赖，但不是必需项。使用 GPU 容器前需要：

- Docker Engine，建议使用 rootless 模式。
- NVIDIA Container Toolkit。
- 不要使用 Snap 安装的 Docker，它与 NVIDIA Container Toolkit 存在兼容问题。
- Docker Desktop 也不适用于该项目的 NVIDIA runtime 配置。

Ubuntu 22.04 可参考项目脚本：

```text
scripts/docker/install_docker_ubuntu22.sh
scripts/docker/install_nvidia_container_toolkit.sh
```

构建并启动项目容器：

```bash
docker compose -f scripts/docker/compose.yml up --build
```

运行指定示例：

```bash
docker compose -f examples/<example_name>/compose.yml up --build
```

首次构建会下载并安装依赖，耗时较长；后续运行会复用镜像缓存。

## 5. 安装机器人端 vlahost

将 `vlahost` 放入机器人 ROS 2 工作空间并编译：

```bash
ln -s /path/to/vlahost ~/ros_ws/src/vlahost
cd ~/ros_ws
colcon build --packages-select vlahost
source install/setup.bash
```

机器人端需要能够导入 `rclpy`、`FastAPI`、`uvicorn`、`pinocchio` 和项目消息包 `marvin_msgs`。若编译成功但节点启动时报 Python 模块缺失，应在机器人当前 ROS 2 环境中补齐对应依赖。

## 6. 网络要求

- GPU 服务器应能访问机器人 `vlahost` 的 HTTP 端口，默认 `8000`。
- 推理客户端应能访问 OpenPI 策略服务器的 WebSocket 端口，默认 `8000`。
- 当策略服务器和推理客户端运行在同一台 GPU 服务器时，`--policy-host` 可填写 `localhost`。
- 机器人端与 GPU 服务器分开部署时，确认防火墙和交换机未阻断对应端口。

## 项目参考

- [KLMmotion/openpi-kmd](https://github.com/KLMmotion/openpi-kmd)：OpenPI KMD 环境、训练、策略服务与客户端源码。
- [KLMmotion/vlahost](https://github.com/KLMmotion/vlahost)：机器人端 ROS 2 HTTP 桥接服务。
