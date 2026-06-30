---
title: Real-Robot Deployment
sidebar_position: 5
---

# Real-Robot Inference Deployment

After training, load the checkpoint through a **policy server** and expose an inference API over WebSocket. A **robot client** then collects camera images and robot state, requests action chunks, and sends commands to the robot controller.

## Deployment Architecture

```text
┌─────────────────┐     WebSocket      ┌──────────────────┐
│  Policy Server  │ ◄─────────────────► │  Robot Client    │
│  (GPU Server)   │    obs / action     │  (Robot Side)    │
└─────────────────┘                     └────────┬─────────┘
                                                 │
                                    WebRTC video / WebSocket joint state
                                                 │
                                          ┌──────▼──────┐
                                          │  Robot Body  │
                                          └─────────────┘
```

## 1. Start the Policy Server

Refer to `scripts/serve_policy_pick_blue_bottle.py`. Before deployment, modify two key fields:

```python
CHECKPOINT_DIR = pathlib.Path(
    "/home/wyz/openpi/checkpoints/"
    "pi05_lerobot_datasets0314/"
    "lerobot_datasets0314_finetune/"
    "28000"
)

CONFIG_NAME = "pi05_lerobot_datasets0314"
```

| Field | Description |
| --- | --- |
| `CHECKPOINT_DIR` | Training checkpoint step directory, for example `28000` |
| `CONFIG_NAME` | Config name used during training; must match the training configuration |

Start the service:

```bash
uv run scripts/serve_policy_pick_blue_bottle.py --port 8000
```

After startup, the service will:

1. Load the training configuration through `openpi.training.config.get_config(CONFIG_NAME)`
2. Create the policy through `openpi.policies.policy_config.create_trained_policy(...)`
3. Run warmup inference to compile the model
4. Start `WebsocketPolicyServer` on `0.0.0.0:8000`

### Observation and Action Interface

**Input observation:**

| Field | Format | Description |
| --- | --- | --- |
| `observation/state` | float32 vector | 8D state, EEF pose + gripper |
| `observation/image` | HWC uint8 | Main camera image |
| `observation/wrist_image` | HWC uint8 | Wrist camera image |
| `prompt` | string | Task language instruction |

**Output action:**

| Field | Format | Description |
| --- | --- | --- |
| `actions` | `[T, 7]` | Action chunk sequence |

## 2. Start the Robot Client

`vla_helpers/Openpi_client_policy.py` implements the complete real-robot closed loop:

- Receives video streams through WebRTC (`aiowebrtc/gst_py_save_images.py`)
- Receives EEF pose and gripper state through a WebSocket joint-state server
- Connects to the policy server through `openpi_client.websocket_client_policy.WebsocketClientPolicy`
- Builds observations by resizing images to 224x224 or 256x256 and assembling the 8D state vector
- Requests action chunks and sends them to the robot at the configured rate

Startup command:

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

| Parameter | Description |
| --- | --- |
| `--ws-host` / `--ws-port` | Robot WebSocket bridge address for joint state and action command |
| `--policy-host` / `--policy-port` | Policy server address |
| `--task-prompt` | Natural-language task instruction passed to the model |
| `--replan-steps` | Number of steps actually executed from each action chunk before requesting a new chunk |
| `--action-rate` | Frequency for sending actions to the robot controller, in Hz |

### Client Runtime Logic

1. Continuously collect camera frames and robot state
2. Assemble the observation dict expected by the policy server
3. Call `policy_client.infer(...)` to get an action chunk
4. Scale delta EEF + gripper commands and send them to the robot over WebSocket

## 3. Remote Inference

If GPU resources are on an independent server, the policy server and robot client can run on different machines:

- Policy server: GPU server running `serve_policy_*.py`
- Robot client: robot-side Orin / industrial PC running `Openpi_client_policy.py`
- Communication uses the IP specified by `--policy-host`

Only the lightweight `openpi-client` package is required on the robot side:

```bash
cd $OPENPI_ROOT/packages/openpi-client
pip install -e .
```

## 4. End-to-End Checklist

Before deployment, confirm each item:

- [ ] Checkpoint step directory exists and contains `model.safetensors`
- [ ] `CONFIG_NAME` matches the training config
- [ ] Policy server warmup is complete and port 8000 is reachable
- [ ] Robot WebSocket bridge is running normally
- [ ] Main camera and wrist camera views are normal
- [ ] `--task-prompt` matches the task-description style in training data
- [ ] `--replan-steps` and `--action-rate` match the robot control frequency

## FAQ

**Client connection times out after the policy server starts**

Check whether the firewall allows `--policy-port` and whether `--policy-host` points to the actual policy server IP.

**Action amplitude is too large or the robot jitters**

Reduce the delta-action scaling coefficient, or reduce `--replan-steps` to replan more frequently.

**Image format error**

Confirm that the input image is an HWC uint8 array with size 224x224 or 256x256, matching the training setup.

**Inference latency is high**

Deploy the policy server on a separate GPU machine and resize images on the client side first to reduce transmission bandwidth.
