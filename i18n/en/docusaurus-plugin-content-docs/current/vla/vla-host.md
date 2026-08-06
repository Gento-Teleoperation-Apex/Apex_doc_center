---
title: VLA Host Customer Guide
sidebar_position: 7
---

# VLA Host Customer Guide

`vlahost` connects the robot ROS 2 control system to an external VLA model host. The robot runs `vlahost_server`, which exposes HTTP and WebSocket APIs. The model host does not need ROS: it receives robot state over WebSocket and sends joint targets through the same network API.

This guide uses the default ROS namespace `tj` and a Marvin Pro dual-arm robot. If `APEX_ROS_NAMESPACE` has been changed, replace `/tj/...` with the actual namespace.

## 1. Control Chain

Robot and Teleop must be running, and the Teleop command input must be set to `input=3` (`user`):

```text
VLA model/policy
    | WebSocket /ws/action
    | jointcmd_left/right in radians
    v
vlahost_server
    | publishes /tj/control/user/joint_cmd_A
    | publishes /tj/control/user/joint_cmd_B
    v
joint_cmd_mux (Teleop, input=3=user)
    | forwards only the selected user input
    | publishes /tj/control/joint_cmd_A
    | publishes /tj/control/joint_cmd_B
    v
marvin_robot_node (Robot)
    | validates timestamps and array lengths
    | converts radians to degrees
    | reads the latest command at 200 Hz
    v
MarvinRobot / Marvin SDK
    v
Robot controller and left/right arms
```

When `input` is not `3`, `vlahost_server` still receives actions and publishes `/tj/control/user/joint_cmd_A/B`, but `joint_cmd_mux` does not forward them to `/tj/control/joint_cmd_A/B`. The robot therefore does not execute the VLA command.

### 1.1 Teleop input values

| Input | Name | Input topic | Purpose |
|---:|---|---|---|
| `0` | idle | None | Stop mux output; default |
| `1` | teleop | `/tj/control/qp_controller/joint_cmd_A/B` | VR teleoperation and QP control |
| `2` | planner | `/tj/control/joint_cmd_plan_A/B` | Joint planner |
| `3` | user | `/tj/control/user/joint_cmd_A/B` | VLA Host or a customer controller |
| `4` | replay | `/tj/control/replay/joint_cmd_A/B` | Data playback |

`input=3` selects the user command source. It is not the same as Robot `mode=3`. Robot modes `0/1/3` mean idle, position, and impedance respectively.

## 2. Prerequisites

Before enabling motion, confirm that:

1. The robot workspace is clear and the emergency stop and mechanical limits work.
2. Robot is connected to the controller and neither arm has an active fault.
3. Teleop is running; `joint_cmd_mux` belongs to the Teleop module.
4. VLA output respects robot joint position, velocity, and acceleration limits.
5. The model host can access TCP port `8000` on the robot.
6. Initial testing uses a low speed limit and the first VLA target equals the current joint position.

`vlahost_server` only validates array lengths and finite numeric values. It does not implement complete joint-limit, speed, acceleration, or collision checks. The customer policy must generate continuous and safe trajectories.

## 3. Starting VLA Host

### 3.1 Deployed device

Start Robot and Teleop from the Apex UI or on the robot:

```bash
sudo systemctl start apex-robot.service
sudo systemctl start apex-teleop.service
sudo systemctl status apex-robot.service apex-teleop.service
```

Then start VLA Host:

```bash
source /etc/apex/apex_ros_env.sh
ros2 launch vlahost vlahost_server.launch.py \
  host:=0.0.0.0 \
  port:=8000 \
  ros_namespace:=tj
```

If `/etc/apex/apex_ros_env.sh` is unavailable:

```bash
source /opt/kernelmind/apex/install/setup.bash
ros2 launch vlahost vlahost_server.launch.py host:=0.0.0.0 port:=8000 ros_namespace:=tj
```

### 3.2 Development workspace

```bash
cd /home/marvin/test_apex_ws
colcon build --packages-select vlahost
source install/setup.bash
ros2 launch vlahost vlahost_server.launch.py host:=0.0.0.0 port:=8000 ros_namespace:=tj
```

### 3.3 Service check

Run on the model host or robot:

```bash
curl http://<ROBOT_IP>:8000/health
```

Expected response:

```json
{"status":"ok"}
```

Open `http://<ROBOT_IP>:8000/` for the debug page. Open `http://<ROBOT_IP>:8000/stream/quad.mjpg` to inspect the four-camera composite stream.

## 4. Selecting VLA Input

### 4.1 ROS 2 service

```bash
ros2 service call /tj/control/set_input marvin_msgs/srv/Int "{data: 3}"
```

The response should contain:

```text
success: true
message: Input set to 3
```

Verify the active source:

```bash
ros2 topic echo --once /tj/control/input_mode
```

Expected value:

```yaml
data: 3
```

The Apex Backend can also select the source:

```bash
curl -X POST http://<ROBOT_IP>:8080/api/v1/control/set_input \
  -H 'Content-Type: application/json' \
  -d '{"input":3}'
```

### 4.2 Smooth source transition

`joint_cmd_mux` uses a three-second ramp by default. After switching to `input=3`, each arm starts its own ramp when its first user command arrives, transitioning from current feedback to the VLA target.

- Prepare the VLA action stream before switching.
- Use the corresponding seven values from current `joint_states.positions` as the first target.
- Continue publishing for at least three seconds; do not send one frame and wait.
- Keep targets continuous throughout the transition.

## 5. Model-Side Client

The model host does not require ROS. Copy `vlahost/client.py` and `client_requirements.txt`, then run:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r client_requirements.txt
python3 vlahost/client.py --server-url http://<ROBOT_IP>:8000 --rate-hz 100
```

The client uses two persistent connections:

- `WS /ws/state` receives the latest robot state.
- `WS /ws/action` sends VLA actions.

The provided `run_inference()` is only an integration template. It returns `None` for every action field by default and therefore does not move the robot. Integrate the model in that function or implement another WebSocket client.

### 5.1 Control rate

`vlahost_server` does not repeat, interpolate, or hold actions. Each received action produces one ROS command for every included arm, so the action rate is also the `/tj/control/user/joint_cmd_A/B` publication rate.

| Stage | Default or recommended rate | Notes |
|---|---:|---|
| Example client loop | 10 Hz by default | Interface demonstration only |
| Recommended VLA action output | 100-200 Hz | 200 Hz matches the Robot SDK control thread |
| `joint_cmd_mux` output | Follows active input | Follows user command rate for `input=3` |
| `marvin_robot_node` control thread | 200 Hz | Reads latest A/B commands every 5 ms |

For a model that infers below 100 Hz, output action chunks and interpolate them on the model host with velocity and acceleration constraints, then stream at 100-200 Hz. Sending discrete joint positions at 10 Hz causes visible stepping.

## 6. Action API

### 6.1 WebSocket (recommended for control)

Connect to:

```text
ws://<ROBOT_IP>:8000/ws/action
```

Message format:

```json
{
  "jointcmd_left":  [0.0, -0.5, 0.2, -1.2, 0.0, 0.6, 0.0],
  "jointcmd_right": [0.0, -0.5, -0.2, -1.2, 0.0, -0.6, 0.0],
  "gripper_left": 0.0,
  "gripper_right": 0.0
}
```

| Field | Type | Unit or length | ROS output |
|---|---|---|---|
| `jointcmd_left` | `float[7]` | rad, left L1-L7 | `/tj/control/user/joint_cmd_A` |
| `jointcmd_right` | `float[7]` | rad, right R1-R7 | `/tj/control/user/joint_cmd_B` |
| `joint_cmd_left` | `float[7]` | Alias of `jointcmd_left` | Same as above |
| `joint_cmd_right` | `float[7]` | Alias of `jointcmd_right` | Same as above |
| `gripper_left` | `float` | Defined by the gripper driver; forwarded unchanged | `/control/gripperValueL` |
| `gripper_right` | `float` | Defined by the gripper driver; forwarded unchanged | `/control/gripperValueR` |
| `eef_left/right` | Reserved | Not available | Currently rejected |

Every field may be omitted or set to `null`. For left-arm-only control, send only `jointcmd_left`; no right-arm command is published.

By default, `/ws/action` does not acknowledge every frame. For debugging, connect with:

```text
ws://<ROBOT_IP>:8000/ws/action?ack=true
```

Each frame then returns `{"success":true}`.

### 6.2 HTTP (single-frame debugging)

HTTP is suitable for API verification, not 100-200 Hz control:

```bash
curl -X POST http://<ROBOT_IP>:8000/action \
  -H 'Content-Type: application/json' \
  -d '{
    "jointcmd_left":[0.0,-0.5,0.2,-1.2,0.0,0.6,0.0],
    "jointcmd_right":[0.0,-0.5,-0.2,-1.2,0.0,-0.6,0.0]
  }'
```

## 7. State API

### 7.1 WebSocket

```text
ws://<ROBOT_IP>:8000/ws/state?rate_hz=100
```

`rate_hz` controls how often the server sends its latest snapshot. It does not change upstream ROS rates or guarantee delivery of every ROS message. The endpoint defaults to 30 Hz; the provided client requests 10 Hz by default.

A state snapshot contains:

- `stamp`: snapshot timestamp.
- `joint_states`: 14 positions, velocities, efforts, and estimated joint forces.
- `eef_left` and `eef_right`: position plus quaternion orientation.
- `gripper_left` and `gripper_right`: position, velocity, torque, temperatures, error, and raw values.
- `quad_image`: MJPEG stream metadata and `stream_url`.

Joint order is fixed:

```text
positions[0:7]  = left arm L1,L2,L3,L4,L5,L6,L7
positions[7:14] = right arm R1,R2,R3,R4,R5,R6,R7
```

Joint positions use radians and velocities use radians per second. `efforts` and `est_joint_force` currently use the same SDK-estimated torque data. End-effector positions use meters and orientations use quaternion order `x,y,z,w`.

### 7.2 HTTP snapshot and MJPEG

```bash
curl http://<ROBOT_IP>:8000/state
```

Image bytes are not embedded in the state JSON. `quad_image.stream_url` points to:

```text
http://<ROBOT_IP>:8000/stream/quad.mjpg
```

## 8. ROS Topics and Rates

The following interfaces use the default namespace `tj`. Rates are nominal and may vary with CPU load and ROS scheduling.

### 8.1 VLA Host subscriptions

| Topic | Type | Nominal rate | Purpose |
|---|---|---:|---|
| `/tj/info/joint_feedback` | `marvin_msgs/msg/Jointfeedback` | 200 Hz | Position, velocity, and torque for 14 arm joints |
| `/tj/info/eef_left` | `geometry_msgs/msg/PoseStamped` | Teleop nominally 1000 Hz | Left FK pose |
| `/tj/info/eef_right` | `geometry_msgs/msg/PoseStamped` | Teleop nominally 1000 Hz | Right FK pose |
| `/quad_tile/compressed` | `sensor_msgs/msg/CompressedImage` | Camera configuration, typically 30 Hz | 2x2 GMSL camera composite |
| `/info/gripper_feedback_L` | `std_msgs/msg/Float32MultiArray` | Tool-dependent | Left gripper feedback |
| `/info/gripper_feedback_R` | `std_msgs/msg/Float32MultiArray` | Tool-dependent | Right gripper feedback |
| `/info/gripper_feedback_L_err` | `std_msgs/msg/Int32MultiArray` | Tool-dependent | Left gripper error code |
| `/info/gripper_feedback_R_err` | `std_msgs/msg/Int32MultiArray` | Tool-dependent | Right gripper error code |

VLA Host stores only the latest end-effector values. It does not forward the complete 1000 Hz history. The model receives state at the `/ws/state?rate_hz=...` rate.

### 8.2 Publications and downstream path

| Topic or service | Type | Rate or QoS | Purpose |
|---|---|---|---|
| `/tj/control/user/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Left action rate; Best Effort | Left seven-joint VLA target in radians |
| `/tj/control/user/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Right action rate; Best Effort | Right seven-joint VLA target in radians |
| `/tj/control/set_input` | `marvin_msgs/srv/Int` | On demand | Select mux input; VLA requires `3` |
| `/tj/control/input_mode` | `std_msgs/msg/Int32` | On startup/change; Transient Local | Current mux input |
| `/tj/control/joint_cmd_A` | `marvin_msgs/msg/JointcmdArm` | Active input rate; Best Effort | Final left command to Robot |
| `/tj/control/joint_cmd_B` | `marvin_msgs/msg/JointcmdArm` | Active input rate; Best Effort | Final right command to Robot |
| `/control/gripperValueL` | `std_msgs/msg/Float32` | Action field rate | Global left gripper command |
| `/control/gripperValueR` | `std_msgs/msg/Float32` | Action field rate | Global right gripper command |

The VLA, mux, and Robot joint-command path uses Best Effort semantics. Robot uses `KeepLast(1)` and only consumes the newest target. Commands whose ROS timestamp is older than 100 ms are discarded.

## 9. Robot Command Execution

Current Robot defaults are:

```yaml
control_rate: 200
ff_mode: true
ff_interval: 5
```

After receiving `/tj/control/joint_cmd_A/B`, Robot:

1. Rejects a command whose timestamp is more than 100 ms from current ROS time.
2. Requires exactly seven joint positions per arm.
3. Converts radians to degrees and updates that arm's latest-command cache.
4. Reads new commands at 200 Hz while Ready and in position (`1`) or impedance (`3`) mode.
5. Calls `PosCmd(A,B)` when both arms are new, or `PosCmdA`/`PosCmdB` for one arm.
6. Calls `emptyCmd()` when no new command exists or the robot is not controllable.

Running Robot alone does not mean that VLA motion is enabled. Robot must be connected and Ready, Robot mode must be position or impedance, Teleop mux input must be user (`3`), and VLA must continuously send fresh valid commands.

## 10. Recommended Integration Procedure

### 10.1 Feedback-only check

Keep `input=0`:

```bash
ros2 service call /tj/control/set_input marvin_msgs/srv/Int "{data: 0}"
curl http://<ROBOT_IP>:8000/state
```

Confirm joint, end-effector, gripper, and camera fields are not `null`. A `null` field means VLA Host has not received the corresponding ROS topic.

### 10.2 Check VLA user topics

Keep the robot idle, send one test action, then run:

```bash
ros2 topic echo --once /tj/control/user/joint_cmd_A
ros2 topic echo --once /tj/control/user/joint_cmd_B
```

### 10.3 Check mux forwarding

After selecting `input=3`:

```bash
ros2 topic hz /tj/control/user/joint_cmd_A
ros2 topic hz /tj/control/joint_cmd_A
```

Repeat for arm B. User input and final mux output should have similar average rates.

### 10.4 Low-speed physical test

1. Set the first VLA target to current joint feedback.
2. Start a continuous 100-200 Hz action stream.
3. Select `input=3`.
4. Have a qualified operator set Robot Ready in a controllable mode.
5. Begin with a very small, low-speed single-joint motion.
6. Verify arm directions, joint order, limits, and emergency stop.

## 11. Stopping Control

Before stopping the model or VLA Host, switch the mux to idle:

```bash
ros2 service call /tj/control/set_input marvin_msgs/srv/Int "{data: 0}"
```

Then stop the client and server. To restore VR teleoperation:

```bash
ros2 service call /tj/control/set_input marvin_msgs/srv/Int "{data: 1}"
```

A disconnected WebSocket does not automatically reset `input_mode` to `0`. VLA Host stops publishing new commands, but the customer client should implement a connection watchdog and actively switch back to idle.

## 12. Diagnostics

```bash
# Nodes and services
ros2 node list | grep -E 'vlahost|joint_mux|marvin_robot'
ros2 service list | grep /tj/control/set_input

# Active mux input
ros2 topic echo --once /tj/control/input_mode

# User commands and mux output
ros2 topic hz /tj/control/user/joint_cmd_A
ros2 topic hz /tj/control/joint_cmd_A

# Endpoints and QoS
ros2 topic info -v /tj/control/user/joint_cmd_A
ros2 topic info -v /tj/control/joint_cmd_A

# Robot feedback and end-effector rate
ros2 topic hz /tj/info/joint_feedback
ros2 topic hz /tj/info/eef_left

# Network API
curl http://<ROBOT_IP>:8000/health
curl http://<ROBOT_IP>:8000/state
```

| Symptom | Check |
|---|---|
| `/health` is unreachable | Server process, IP, port, firewall, and routing |
| A state field is `null` | Corresponding ROS topic and namespace |
| User topic has data but final topic does not | `input_mode=3` and Teleop/joint_cmd_mux running |
| Final topic has data but the robot does not move | Robot connection, Ready, mode, timestamp, and faults |
| Command is about 10 Hz and motion steps | Increase client output rate or interpolate action chunks |
| Only one arm moves | The other action field and B topic |
| Large motion immediately after switching | First target differs from feedback or ramp commands were not continuous |

## 13. Server Parameters

| Parameter | Default | Description |
|---|---:|---|
| `host` | `0.0.0.0` | HTTP/WebSocket listen address |
| `port` | `8000` | HTTP/WebSocket port |
| `ros_namespace` | `tj` | Namespace for Robot and Teleop core topics |
| `image_max_width` | `640` | Maximum re-encoded image width |
| `image_max_height` | `360` | Maximum re-encoded image height |
| `image_jpeg_quality` | `55` | JPEG quality, 1-95 |
| `image_stream_fps` | `60.0` | MJPEG target limit, capped by source rate |
| `image_passthrough` | `false` | Forward upstream JPEG without decode/re-encode |

If `/quad_tile/compressed` already has a suitable JPEG size, set `image_passthrough=true` to reduce CPU load and latency. The standard launch exposes only `host`, `port`, and `ros_namespace`. Override image parameters in a customer launch or update the parameter dictionary in `vlahost_server.launch.py` and rebuild.

## 14. Network and Safety Restrictions

- The current API has no authentication or TLS. Never expose port `8000` to the public internet or an untrusted network.
- Use an isolated LAN and firewall allowlist. Add TLS and authentication at a reverse proxy when required.
- `/ws/action` directly accepts motion commands; any client that can reach it may command the robot.
- VLA Host does not provide collision checking and does not replace the emergency stop, safety PLC, or operating procedure.
- The customer client should implement connection timeout, state timeout, model-failure handling, finite-value checks, joint limits, and velocity/acceleration watchdogs.
