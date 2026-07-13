---
title: Real-Robot Deployment
sidebar_position: 5
---

# Real-Robot Inference Deployment

The current KMD deployment consists of three processes: `vlahost` runs on the robot, while the OpenPI policy server and inference client run on a GPU machine. The robot only provides state, camera, and action interfaces and does not need the complete OpenPI training environment.

## Deployment Architecture

```text
Robot (ROS 2)                            GPU machine
┌─────────────────────┐  GET /state     ┌──────────────────────────┐
│ vlahost             │ ◄────────────── │ OpenPI inference client  │
│ - joint / EEF state │  state + image  │ - builds observations    │
│ - quad camera image │ ──────────────► │ - queries policy server  │
│ - action publishers │  POST /action   │ - sends joint actions    │
└─────────────────────┘ ◄────────────── └────────────┬─────────────┘
                                                     │ WebSocket
                                       ┌─────────────▼─────────────┐
                                       │ OpenPI policy server      │
                                       │ checkpoint inference      │
                                       └───────────────────────────┘
```

## Data Contract

The current deployment expects:

- Three camera inputs: `cam_high`, `cam_left_wrist`, and `cam_right_wrist`.
- A 16D joint state: `[7 left-arm joints, left gripper, 7 right-arm joints, right gripper]`.
- A 16D joint action with the same dimension order.
- Joint angles in degrees inside the model and radians in robot ROS feedback and commands. The client performs the unit conversion.

By default, `vlahost` maps the quad image as follows:

| Quad tile | Model camera field |
| --- | --- |
| Top right | `cam_left_wrist` |
| Bottom left | `cam_right_wrist` |
| Bottom right | `cam_high` |
| Top left | Ignored |

If the physical camera layout differs, adjust the mapping or crop settings in the inference client.

## 1. Install vlahost on the Robot

The robot requires ROS 2 and FastAPI and must publish robot-state and camera topics:

```bash
git clone https://github.com/KLMmotion/vlahost.git
ln -s /path/to/vlahost ~/ros_ws/src/vlahost
cd ~/ros_ws
colcon build --packages-select vlahost
source install/setup.bash
```

`vlahost` subscribes to these topics by default:

| Topic | Type | Content |
| --- | --- | --- |
| `/info/joint_feedback` | `marvin_msgs/Jointfeedback` | Dual-arm joint feedback |
| `/info/eef_left` | `geometry_msgs/PoseStamped` | Left end-effector pose |
| `/info/eef_right` | `geometry_msgs/PoseStamped` | Right end-effector pose |
| `quad_tile/compressed` | `sensor_msgs/CompressedImage` | Quad-camera JPEG image |

## 2. Start the Robot-Side Service

```bash
source ~/ros_ws/install/setup.bash
ros2 launch vlahost vlahost_server.launch.py host:=0.0.0.0 port:=8000
```

The service provides these HTTP endpoints:

| Endpoint | Purpose |
| --- | --- |
| `GET /` | Browser debug page and live camera preview |
| `GET /health` | Service health check |
| `GET /state` | Joint state, EEF poses, and quad image |
| `POST /action` | EEF or 16D joint-action command |

From the GPU machine or another computer on the same LAN, open:

```text
http://<ROBOT_HOST>:8000/health
```

Start the policy server and inference client only after this endpoint responds normally.

## 3. Start the Policy Server

Prepare the trained checkpoint on the GPU machine and confirm that it contains:

```text
<checkpoint_step>/model.safetensors
<checkpoint_step>/assets/<asset_id>/norm_stats.json
```

From the `openpi-kmd` repository root, run:

```bash
uv run scripts/serve_policy_kmd_joint.py \
  --checkpoint-dir /ABS/PATH/TO/CHECKPOINT_STEP \
  --repo-id <dataset_id> \
  --asset-id <asset_id> \
  --port 8000
```

`--repo-id` and `--asset-id` normally use the dataset ID from training. `--asset-id` must match the checkpoint normalization-statistics directory. The policy server listens on `0.0.0.0:8000`.

## 4. Start the Inference Client

Run the following on a GPU machine that can reach both robot-side `vlahost` and the policy server:

```bash
uv run python vla_helpers/openpi_client_policy_http_kmd_joint.py \
  --robot-server-url http://<ROBOT_HOST>:8000 \
  --policy-host localhost \
  --policy-port 8000 \
  --task-prompt "pick and place"
```

Common parameters:

| Parameter | Description |
| --- | --- |
| `--robot-server-url` | Robot-side `vlahost` URL |
| `--robot-timeout-sec` | HTTP timeout for `/state` and `/action` |
| `--policy-host` / `--policy-port` | OpenPI policy-server address |
| `--task-prompt` | Natural-language task instruction sent to the model |
| `--replan-steps` | Number of actions executed from each predicted chunk |
| `--action-rate` | Action command rate in Hz |
| `--disable-action-post` | Run inference without sending actions; recommended for initial integration |
| `--no-joints-in-radians` | Use only when `vlahost` already returns joint angles in degrees |

## 5. Connectivity Test

`vlahost` includes a lightweight test client for checking HTTP and camera connectivity without starting a model:

```bash
cd /path/to/vlahost
python3 -m venv .venv
source .venv/bin/activate
pip install -r client_requirements.txt
python3 vlahost/client.py --server-url http://<ROBOT_HOST>:8000
```

Add `--show-images` to display the four camera tiles:

```bash
python3 vlahost/client.py \
  --server-url http://<ROBOT_HOST>:8000 \
  --show-images
```

## 6. Startup Order and Checklist

1. Confirm that the checkpoint step directory contains `model.safetensors`.
2. Confirm that `assets/<asset_id>/norm_stats.json` exists.
3. Start the robot base services and verify joint feedback and quad-camera topics.
4. Start robot-side `vlahost` and verify `/health` and `/state`.
5. Start the OpenPI policy server and wait for model loading to complete.
6. For the first run, start the inference client with `--disable-action-post` and verify camera order, state dimensions, and units.
7. After all checks pass, enable action posting and begin testing at low speed in a clear area.

## FAQ

**Inference fails immediately after the policy server starts**

Check the checkpoint path, `model.safetensors`, `asset_id`, and `norm_stats.json`. Also confirm that the checkpoint was trained for the three-camera, 16D joint-space layout.

**The client receives no robot state**

Check that `vlahost` is running, that `GET /state` returns `joint_states.positions`, and that the array contains the expected 14 dual-arm joint values.

**Robot motion has the wrong direction or amplitude**

Check left/right arm order, gripper dimensions, and degree/radian conversion. The default order is `[7 left-arm joints, left gripper, 7 right-arm joints, right gripper]`.

**Camera views are mapped incorrectly**

Check the `quad_image` tile layout and adjust the client camera mapping and `--crop-*` or `--wrist-crop-*` arguments to match the physical installation.

## Project References

- [KLMmotion/openpi-kmd](https://github.com/KLMmotion/openpi-kmd): KMD joint-space policy server and real-robot inference client.
- [KLMmotion/vlahost](https://github.com/KLMmotion/vlahost): HTTP bridge between robot ROS 2 topics and a remote VLA inference client.
