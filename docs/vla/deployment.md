---
title: 真机部署
sidebar_position: 5
---

# 真机推理部署

当前 KMD 真机链路由三个进程组成：机器人端运行 `vlahost`，GPU 服务器运行 OpenPI 策略服务器和推理客户端。机器人端只负责提供状态、相机画面和动作接口，不需要安装完整的 OpenPI 训练环境。

## 部署架构

```text
机器人（ROS 2）                         GPU 服务器
┌─────────────────────┐  GET /state    ┌──────────────────────────┐
│ vlahost             │ ◄───────────── │ OpenPI 推理客户端         │
│ - 关节与末端状态     │  状态 + 图像    │ - 组装观测与语言指令      │
│ - 四宫格相机图像     │ ─────────────► │ - 调用策略服务器          │
│ - 动作话题发布       │  POST /action  │ - 下发关节动作            │
└─────────────────────┘ ◄───────────── └────────────┬─────────────┘
                                                    │ WebSocket
                                      ┌─────────────▼─────────────┐
                                      │ OpenPI 策略服务器          │
                                      │ 加载 checkpoint 并推理     │
                                      └───────────────────────────┘
```

## 数据接口

当前部署适配以下数据格式：

- 三路相机：`cam_high`、`cam_left_wrist`、`cam_right_wrist`。
- 16 维关节状态：`[左臂 7 关节, 左夹爪, 右臂 7 关节, 右夹爪]`。
- 16 维关节动作：维度和顺序与关节状态一致。
- 模型内部关节角使用角度制，机器人 ROS 反馈和动作使用弧度制，客户端负责单位转换。

`vlahost` 从四宫格图像中默认取用以下区域：

| 四宫格区域 | 模型相机字段 |
| --- | --- |
| 右上 | `cam_left_wrist` |
| 左下 | `cam_right_wrist` |
| 右下 | `cam_high` |
| 左上 | 忽略 |

如果实际相机排列不同，需要在推理客户端中调整映射或裁剪参数。

## 1. 在机器人端安装 vlahost

机器人端需要 ROS 2、FastAPI，并能够收到机器人状态与相机话题：

```bash
git clone https://github.com/KLMmotion/vlahost.git
ln -s /path/to/vlahost ~/ros_ws/src/vlahost
cd ~/ros_ws
colcon build --packages-select vlahost
source install/setup.bash
```

`vlahost` 默认订阅：

| 话题 | 类型 | 内容 |
| --- | --- | --- |
| `/info/joint_feedback` | `marvin_msgs/Jointfeedback` | 双臂关节反馈 |
| `/info/eef_left` | `geometry_msgs/PoseStamped` | 左末端位姿 |
| `/info/eef_right` | `geometry_msgs/PoseStamped` | 右末端位姿 |
| `quad_tile/compressed` | `sensor_msgs/CompressedImage` | 四宫格相机 JPEG 图像 |

## 2. 启动机器人端服务

```bash
source ~/ros_ws/install/setup.bash
ros2 launch vlahost vlahost_server.launch.py host:=0.0.0.0 port:=8000
```

服务提供以下 HTTP 接口：

| 接口 | 用途 |
| --- | --- |
| `GET /` | 浏览器调试页和实时相机预览 |
| `GET /health` | 服务健康检查 |
| `GET /state` | 获取关节、末端状态和四宫格图像 |
| `POST /action` | 下发 EEF 或 16 维关节动作 |

在 GPU 服务器或同一局域网内的电脑访问：

```text
http://<ROBOT_HOST>:8000/health
```

返回正常后再启动策略服务器和推理客户端。

## 3. 启动策略服务器

GPU 服务器需准备训练完成的 checkpoint，并确认其中包含：

```text
<checkpoint_step>/model.safetensors
<checkpoint_step>/assets/<asset_id>/norm_stats.json
```

从 `openpi-kmd` 根目录启动：

```bash
uv run scripts/serve_policy_kmd_joint.py \
  --checkpoint-dir /ABS/PATH/TO/CHECKPOINT_STEP \
  --repo-id <dataset_id> \
  --asset-id <asset_id> \
  --port 8000
```

`--repo-id` 和 `--asset-id` 通常填写训练数据集使用的 ID；`--asset-id` 必须与 checkpoint 中归一化统计目录一致。策略服务器监听 `0.0.0.0:8000`。

## 4. 启动推理客户端

在能够同时访问机器人端 `vlahost` 和策略服务器的 GPU 服务器上执行：

```bash
uv run python vla_helpers/openpi_client_policy_http_kmd_joint.py \
  --robot-server-url http://<ROBOT_HOST>:8000 \
  --policy-host localhost \
  --policy-port 8000 \
  --task-prompt "pick and place"
```

常用参数：

| 参数 | 说明 |
| --- | --- |
| `--robot-server-url` | 机器人端 `vlahost` 地址 |
| `--robot-timeout-sec` | `/state` 和 `/action` 的 HTTP 超时时间 |
| `--policy-host` / `--policy-port` | OpenPI 策略服务器地址 |
| `--task-prompt` | 发送给模型的自然语言任务指令 |
| `--replan-steps` | 每次预测的动作 chunk 中实际执行的步数 |
| `--action-rate` | 动作下发频率，单位 Hz |
| `--disable-action-post` | 仅推理，不向机器人下发动作，首次联调建议启用 |
| `--no-joints-in-radians` | 仅当 `vlahost` 已输出角度制关节值时使用 |

## 5. 连通性测试

`vlahost` 提供轻量测试客户端，可在不启动模型时验证 HTTP 和相机链路：

```bash
cd /path/to/vlahost
python3 -m venv .venv
source .venv/bin/activate
pip install -r client_requirements.txt
python3 vlahost/client.py --server-url http://<ROBOT_HOST>:8000
```

需要查看四宫格相机画面时增加 `--show-images`：

```bash
python3 vlahost/client.py \
  --server-url http://<ROBOT_HOST>:8000 \
  --show-images
```

## 6. 启动顺序与检查清单

1. 确认 checkpoint 步数目录包含 `model.safetensors`。
2. 确认 `assets/<asset_id>/norm_stats.json` 存在。
3. 启动机器人基础程序，确认关节反馈与四宫格相机话题正常。
4. 启动机器人端 `vlahost`，确认 `/health` 和 `/state` 可访问。
5. 启动 OpenPI 策略服务器，等待模型加载完成。
6. 首次使用 `--disable-action-post` 启动推理客户端，核对相机顺序、状态维度和单位。
7. 确认无误后允许客户端下发动作，并从低速、空旷环境开始测试。

## 常见问题

**策略服务器启动后推理立即失败**

检查 checkpoint 路径、`model.safetensors`、`asset_id` 和 `norm_stats.json`。还需确认 checkpoint 使用三路相机、16 维关节空间格式训练。

**客户端无法获得机器人状态**

检查 `vlahost` 是否运行、`GET /state` 是否返回 `joint_states.positions`，以及该数组是否包含预期的 14 个双臂关节值。

**机器人动作方向或幅度异常**

检查左右臂顺序、夹爪维度以及角度/弧度转换。默认顺序为 `[左臂 7, 左夹爪, 右臂 7, 右夹爪]`。

**相机画面对应错误**

检查 `quad_image` 四宫格排列，并按实际安装位置调整客户端中的相机映射和 `--crop-*`、`--wrist-crop-*` 参数。

## 项目参考

- [KLMmotion/openpi-kmd](https://github.com/KLMmotion/openpi-kmd)：KMD 关节空间策略服务器和真机推理客户端。
- [KLMmotion/vlahost](https://github.com/KLMmotion/vlahost)：机器人 ROS 2 与远程 VLA 推理客户端之间的 HTTP 桥接服务。
