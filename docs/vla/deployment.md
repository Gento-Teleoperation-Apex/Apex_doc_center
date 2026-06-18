---
title: 真机部署
sidebar_position: 5
---

# 真机推理部署

训练完成后，通过**策略服务器**加载 checkpoint 并通过 WebSocket 对外提供推理 API，再由**机器人客户端**采集相机画面与本体状态、请求动作 chunk 并下发至机器人控制器。

## 部署架构

```text
┌─────────────────┐     WebSocket      ┌──────────────────┐
│  策略服务器      │ ◄─────────────────► │  机器人客户端     │
│  (GPU 服务器)    │    观测 / 动作      │  (机器人侧)       │
└─────────────────┘                     └────────┬─────────┘
                                                 │
                                    WebRTC 视频 / WebSocket 关节状态
                                                 │
                                          ┌──────▼──────┐
                                          │  机器人本体  │
                                          └─────────────┘
```

## 1. 启动策略服务器

参考脚本 `scripts/serve_policy_pick_blue_bottle.py`，部署前需修改两个关键字段：

```python
CHECKPOINT_DIR = pathlib.Path(
    "/home/wyz/openpi/checkpoints/"
    "pi05_lerobot_datasets0314/"
    "lerobot_datasets0314_finetune/"
    "28000"
)

CONFIG_NAME = "pi05_lerobot_datasets0314"
```

| 字段 | 说明 |
| --- | --- |
| `CHECKPOINT_DIR` | 训练 checkpoint 步数目录，例如 `28000` |
| `CONFIG_NAME` | 训练时使用的 config 名称，需与训练配置一致 |

启动服务：

```bash
uv run scripts/serve_policy_pick_blue_bottle.py --port 8000
```

服务启动后会：

1. 通过 `openpi.training.config.get_config(CONFIG_NAME)` 加载训练配置
2. 调用 `openpi.policies.policy_config.create_trained_policy(...)` 创建策略
3. 执行 warmup 推理以编译模型
4. 在 `0.0.0.0:8000` 启动 `WebsocketPolicyServer`

### 观测与动作接口

**输入观测：**

| 字段 | 格式 | 说明 |
| --- | --- | --- |
| `observation/state` | float32 向量 | 8 维状态（EEF 位姿 + 夹爪） |
| `observation/image` | HWC uint8 | 主相机图像 |
| `observation/wrist_image` | HWC uint8 | 腕部相机图像 |
| `prompt` | string | 任务语言指令 |

**输出动作：**

| 字段 | 格式 | 说明 |
| --- | --- | --- |
| `actions` | `[T, 7]` | 动作 chunk 序列 |

## 2. 启动机器人客户端

脚本 `vla_helpers/Openpi_client_policy.py` 实现完整的真机闭环：

- 通过 WebRTC（`aiowebrtc/gst_py_save_images.py`）接收视频流
- 通过 WebSocket 关节状态服务器接收 EEF 位姿与夹爪状态
- 通过 `openpi_client.websocket_client_policy.WebsocketClientPolicy` 连接策略服务器
- 构建观测（resize 图像至 224×224 或 256×256，组装 8 维状态向量）
- 请求动作 chunk 并按频率下发至机器人

启动命令：

```bash
uv run vla_helpers/Openpi_client_policy.py \
  --ws-host <ROBOT_WS_HOST> \
  --ws-port <ROBOT_WS_PORT> \
  --policy-host <POLICY_SERVER_HOST> \
  --policy-port 8000 \
  --task-prompt "Pick up the blue square and move it to the blue plate" \
  --replan-steps 5 \
  --action-rate 5.0
```

| 参数 | 说明 |
| --- | --- |
| `--ws-host` / `--ws-port` | 机器人 WebSocket 桥接地址（关节状态 + 动作指令） |
| `--policy-host` / `--policy-port` | 策略服务器地址 |
| `--task-prompt` | 传给模型的自然语言任务指令 |
| `--replan-steps` | 每个动作 chunk 中实际执行的步数，执行完后重新请求 |
| `--action-rate` | 向机器人控制器发送动作的频率（Hz） |

### 客户端运行逻辑

1. 持续采集相机帧与机器人状态
2. 组装策略服务器期望的 observation dict
3. 调用 `policy_client.infer(...)` 获取动作 chunk
4. 缩放 delta EEF + 夹爪指令，通过 WebSocket 发送至机器人

## 3. 远程推理

若 GPU 资源在独立服务器上，策略服务器与机器人客户端可部署在不同机器：

- 策略服务器：GPU 服务器，运行 `serve_policy_*.py`
- 机器人客户端：机器人侧 Orin / 工控机，运行 `Openpi_client_policy.py`
- 两者通过 `--policy-host` 指定的 IP 通信

机器人侧仅需安装轻量依赖的 `openpi-client` 包：

```bash
cd $OPENPI_ROOT/packages/openpi-client
pip install -e .
```

## 4. 端到端检查清单

部署前逐项确认：

- [ ] checkpoint 步数目录存在且包含 `model.safetensors`
- [ ] `CONFIG_NAME` 与训练 config 一致
- [ ] 策略服务器 warmup 完成，端口 8000 可访问
- [ ] 机器人 WebSocket 桥接正常运行
- [ ] 主相机与腕部相机画面正常
- [ ] `--task-prompt` 与训练数据中的任务描述风格一致
- [ ] `--replan-steps` 与 `--action-rate` 匹配机器人控制频率

## 常见问题

**策略服务器启动后客户端连接超时**

检查防火墙是否放行 `--policy-port`，以及 `--policy-host` 是否指向策略服务器实际 IP。

**动作幅度过大或机器人抖动**

调低 delta action 缩放系数，或减小 `--replan-steps` 以更频繁地重新规划。

**图像格式报错**

确认输入图像为 HWC 格式的 uint8 数组，尺寸为 224×224 或 256×256，与训练时一致。

**推理延迟高**

将策略服务器部署在带 GPU 的独立机器上，并在客户端侧预先 resize 图像以减少传输带宽。
